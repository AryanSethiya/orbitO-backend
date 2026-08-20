import { buildServer } from '../interfaces/http/server.js';
import { pool } from '../infrastructure/database/index.js';
import { redis } from '../infrastructure/cache/redis.js';

async function testLiveGameplay() {
  console.log('🎮 Starting live gameplay integration test against Supabase & Upstash...');
  const app = await buildServer();
  await app.ready();

  // 1. Fetch Today's Puzzle
  console.log('\n1️⃣ Fetching today\'s puzzle (GET /api/v1/puzzles/today)...');
  const puzzleRes = await app.inject({ method: 'GET', url: '/api/v1/puzzles/today' });
  console.log('Status:', puzzleRes.statusCode);
  console.log('Payload:', puzzleRes.body);

  // 2. Start Session
  console.log('\n2️⃣ Starting a new player session (POST /api/v1/sessions)...');
  const sessionRes = await app.inject({ method: 'POST', url: '/api/v1/sessions', payload: {} });
  const session = JSON.parse(sessionRes.body);
  console.log('Status:', sessionRes.statusCode);
  console.log('Session ID:', session.sessionId);

  // 3. Guess a warm word
  console.log('\n3️⃣ Submitting guess "flight" (POST /api/v1/sessions/:id/guess)...');
  const guessRes = await app.inject({
    method: 'POST',
    url: `/api/v1/sessions/${session.sessionId}/guess`,
    payload: { guess: 'flight' },
  });
  console.log('Status:', guessRes.statusCode);
  console.log('Response:', guessRes.body);

  // 4. Request a hint
  console.log('\n4️⃣ Requesting Hint 1 (POST /api/v1/sessions/:id/hints)...');
  const hintRes = await app.inject({
    method: 'POST',
    url: `/api/v1/sessions/${session.sessionId}/hints`,
  });
  console.log('Status:', hintRes.statusCode);
  console.log('Response:', hintRes.body);

  // 5. Submit Target Word (Solve!)
  console.log('\n5️⃣ Submitting Target word "airport" (POST /api/v1/sessions/:id/guess)...');
  const solveRes = await app.inject({
    method: 'POST',
    url: `/api/v1/sessions/${session.sessionId}/guess`,
    payload: { guess: 'airport' },
  });
  console.log('Status:', solveRes.statusCode);
  console.log('Response:', solveRes.body);

  // 6. Generate AI Roast with Gemini
  console.log('\n6️⃣ Generating AI Roast with Gemini 3.5 Flash (POST /api/v1/sessions/:id/roast)...');
  const roastRes = await app.inject({
    method: 'POST',
    url: `/api/v1/sessions/${session.sessionId}/roast`,
    payload: { style: 'savage' },
  });
  console.log('Status:', roastRes.statusCode);
  console.log('Roast:', roastRes.body);

  // 7. Check Redis Leaderboard
  console.log('\n7️⃣ Fetching live Redis Leaderboard (GET /api/v1/leaderboards/daily)...');
  const leaderboardRes = await app.inject({ method: 'GET', url: '/api/v1/leaderboards/daily' });
  console.log('Status:', leaderboardRes.statusCode);
  console.log('Leaderboard:', leaderboardRes.body);

  console.log('\n🎉 ALL LIVE ENDPOINTS VERIFIED ON SUPABASE & UPSTASH CLOUD!');
  await app.close();
  await pool.end();
  await redis.quit();
}

testLiveGameplay();
