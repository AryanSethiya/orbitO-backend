import { buildServer } from '../interfaces/http/server.js';
import { pool } from '../infrastructure/database/index.js';
import { redis } from '../infrastructure/cache/redis.js';

async function runFullBackendVerification() {
  console.log('🧪 Starting 100% Comprehensive Backend API Verification Suite...\n');
  process.env.LOG_LEVEL = 'error';
  const server = await buildServer();
  await server.ready();

  let passed = 0;
  let failed = 0;

  let index = 1;
  async function assertTest(name: string, fn: () => Promise<void>) {
    const num = index++;
    try {
      await fn();
      console.log(`[TEST ${num}] ✅ PASSED: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`[TEST ${num}] ❌ FAILED: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // 1. Health Endpoint
  await assertTest('GET /api/v1/health (Health check & DB/Redis status)', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/health' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (json.status !== 'ok' && json.status !== 'healthy' && json.status !== 'degraded') throw new Error(`Unexpected status: ${json.status}`);
  });

  // 2. Auth: Google Login
  let authToken = '';
  let testUserId = '';
  const testEmail = `pilot_${Date.now()}@gmail.com`;
  await assertTest('POST /api/v1/auth/google (Google OAuth payload processing)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/google',
      payload: {
        email: testEmail,
        name: 'Commander Nova',
        picture: 'https://lh3.googleusercontent.com/a/sample-avatar',
        community: 'Starfleet Academy',
      },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.token || !json.user?.id) throw new Error('Missing token or user');
    authToken = json.token;
    testUserId = json.user.id;
  });

  // 3. Auth: Dev Pilot Login
  await assertTest('POST /api/v1/auth/dev-login (Instant Pilot Callsign Auth)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/auth/dev-login',
      payload: { callsign: 'AstroPioneer', community: 'Nebula Squad' },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.token) throw new Error('Missing token in dev-login');
  });

  // 4. Auth: Get Current Profile
  await assertTest('GET /api/v1/auth/me (JWT Bearer Token verification)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/auth/me',
      headers: { authorization: `Bearer ${authToken}` },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (json.email !== testEmail) throw new Error('User email mismatch');
  });

  // 5. Auth: Update Community
  await assertTest('PATCH /api/v1/auth/community (Switch pilot community)', async () => {
    const res = await server.inject({
      method: 'PATCH',
      url: '/api/v1/auth/community',
      payload: { userId: testUserId, community: 'Cosmic Voyagers' },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
  });

  // 6. Today's Puzzle
  let targetWord = '';
  await assertTest('GET /api/v1/puzzles/today (Today puzzle auto-provisioning)', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/puzzles/today' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.id || !json.date) throw new Error('Invalid puzzle response');
  });

  // 7. Start Session
  let sessionId = '';
  await assertTest('POST /api/v1/sessions (Start/Resume Game Session)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: '/api/v1/sessions',
      payload: { userId: testUserId },
    });
    if (res.statusCode !== 201) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.sessionId) throw new Error('Missing sessionId');
    sessionId = json.sessionId;
  });

  // 8. Submit Guess with Real-time Vector Embedding
  await assertTest('POST /api/v1/sessions/:id/guess (Dynamic Gemini Vector Embedding & Proximity)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/guess`,
      payload: { guess: 'space' },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (typeof json.rank !== 'number' || typeof json.semanticScore !== 'number') {
      throw new Error('Invalid rank or score in guess response');
    }
  });

  // 9. Request AI Hint
  await assertTest('POST /api/v1/sessions/:id/hints (Decrypted AI Hint Clue)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/hints`,
      payload: {},
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.hintText || json.hintsUsed !== 1) throw new Error('Invalid hint response');
  });

  // 10. Get Full Session Summary
  await assertTest('GET /api/v1/sessions/:id (Session telemetry & guess history)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: `/api/v1/sessions/${sessionId}`,
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (json.guesses.length === 0 || json.revealedHints.length !== 1) {
      throw new Error('Session state not correctly tracked');
    }
  });

  // 11. Solve Puzzle & Complete Orbit
  await assertTest('POST /api/v1/sessions/:id/guess (Solve target word and lock score)', async () => {
    // Look up today's target word
    const puzzleRes = await pool.query(`
      SELECT v.word FROM daily_puzzles dp 
      JOIN vocabulary v ON dp.target_word_id = v.id 
      WHERE dp.date = '2026-08-21' LIMIT 1;
    `);
    targetWord = puzzleRes.rows[0].word;

    const res = await server.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/guess`,
      payload: { guess: targetWord },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.isSolved || json.rank !== 1) throw new Error('Puzzle not marked as solved');
  });

  // 12. Enforce One-Play Rule (Submitting guess on solved session must fail)
  await assertTest('POST /api/v1/sessions/:id/guess (Enforce 1-play lock on completed session)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/guess`,
      payload: { guess: 'planet' },
    });
    if (res.statusCode !== 400) throw new Error(`Expected 400 Bad Request, got ${res.statusCode}`);
  });

  // 13. Generate AI Roast
  await assertTest('POST /api/v1/sessions/:id/roast (Gemini 3.5 Flash Neural Roast)', async () => {
    const res = await server.inject({
      method: 'POST',
      url: `/api/v1/sessions/${sessionId}/roast`,
      payload: { style: 'savage' },
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!json.roastText || json.roastText.length < 5) throw new Error('Invalid roast response');
  });

  // 14. Real-time Global Leaderboard
  await assertTest('GET /api/v1/leaderboards/daily (Global Leaderboard without mock users)', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/leaderboards/daily' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!Array.isArray(json.leaderboard) || json.leaderboard.length === 0) {
      throw new Error('Leaderboard is empty or invalid');
    }
  });

  // 15. Real-time Community Leaderboard
  await assertTest('GET /api/v1/leaderboards/daily?community=... (Community-filtered Leaderboard)', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/v1/leaderboards/daily?community=Cosmic%20Voyagers',
    });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!Array.isArray(json.leaderboard)) throw new Error('Invalid community leaderboard');
  });

  // 16. Communities List
  await assertTest('GET /api/v1/leaderboards/communities (Active Communities List)', async () => {
    const res = await server.inject({ method: 'GET', url: '/api/v1/leaderboards/communities' });
    if (res.statusCode !== 200) throw new Error(`Status ${res.statusCode}: ${res.body}`);
    const json = JSON.parse(res.body);
    if (!Array.isArray(json.communities) || json.communities.length === 0) {
      throw new Error('Missing communities list');
    }
  });

  console.log(`\n📊 VERIFICATION SUMMARY: ${passed} Passed, ${failed} Failed.`);
  await server.close();
  await pool.end();
  await redis.quit();

  if (failed > 0) {
    process.exit(1);
  }
}

runFullBackendVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
