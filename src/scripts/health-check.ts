import { pool } from '../infrastructure/database/index.js';
import { redis, checkRedisHealth } from '../infrastructure/cache/redis.js';
import { PuzzleRepository } from '../infrastructure/database/repositories/puzzle.repository.js';
import { VocabularyRepository } from '../infrastructure/database/repositories/vocabulary.repository.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

async function performProductionHealthCheck() {
  console.log('🩺 RUNNING PRODUCTION CLOUD HEALTH CHECK...\n');
  const startTime = Date.now();

  const report = {
    timestamp: new Date().toISOString(),
    overallStatus: 'HEALTHY',
    services: {} as Record<string, any>,
  };

  // 1. PostgreSQL on Supabase
  try {
    const t0 = Date.now();
    const res = await pool.query('SELECT 1 as ping, current_database(), version()');
    const latency = Date.now() - t0;
    report.services.postgresql = {
      status: 'ONLINE',
      provider: 'Supabase Cloud (ap-south-1)',
      database: res.rows[0].current_database,
      latencyMs: latency,
    };
  } catch (err: any) {
    report.overallStatus = 'DEGRADED';
    report.services.postgresql = { status: 'OFFLINE', error: err.message };
  }

  // 2. Redis on Upstash
  try {
    const t0 = Date.now();
    const isHealthy = await checkRedisHealth();
    const latency = Date.now() - t0;
    report.services.redis = {
      status: isHealthy ? 'ONLINE' : 'OFFLINE',
      provider: 'Upstash Cloud (ap-south-1)',
      latencyMs: latency,
    };
  } catch (err: any) {
    report.overallStatus = 'DEGRADED';
    report.services.redis = { status: 'OFFLINE', error: err.message };
  }

  // 3. Google Gemini AI API
  try {
    const t0 = Date.now();
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: env.GEMINI_CHAT_MODEL });
    const aiRes = await model.generateContent('Say "OK" in 1 word.');
    const latency = Date.now() - t0;
    report.services.gemini_ai = {
      status: 'ONLINE',
      model: env.GEMINI_CHAT_MODEL,
      response: aiRes.response.text().trim(),
      latencyMs: latency,
    };
  } catch (err: any) {
    report.overallStatus = 'DEGRADED';
    report.services.gemini_ai = { status: 'OFFLINE', error: err.message };
  }

  // 4. Database Data Integrity Check
  try {
    const vocabRepo = new VocabularyRepository();
    const puzzleRepo = new PuzzleRepository();
    const totalWords = await vocabRepo.count(env.VOCABULARY_VERSION);
    const today = new Date().toISOString().split('T')[0];
    const todayPuzzle = await puzzleRepo.findByDate(today);

    report.services.data_integrity = {
      status: totalWords > 0 && todayPuzzle ? 'VERIFIED' : 'INCOMPLETE',
      activeVocabularyWords: totalWords,
      todayPuzzleDate: todayPuzzle?.date || 'NOT_FOUND',
      todayTargetWord: todayPuzzle?.targetWord || 'NOT_FOUND',
      todayDifficulty: todayPuzzle?.difficulty || 'NOT_FOUND',
    };
  } catch (err: any) {
    report.services.data_integrity = { status: 'ERROR', error: err.message };
  }

  report.services.totalCheckDurationMs = Date.now() - startTime;

  console.log(JSON.stringify(report, null, 2));

  await pool.end();
  await redis.quit();
}

performProductionHealthCheck();
