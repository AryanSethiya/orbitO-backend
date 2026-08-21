import { buildServer } from './interfaces/http/server.js';
import { env } from './config/env.js';
import { pool } from './infrastructure/database/index.js';
import { redis } from './infrastructure/cache/redis.js';

import { DailyPuzzleService } from './infrastructure/scheduler/daily-puzzle.service.js';

async function start() {
  const server = await buildServer();

  try {
    const address = await server.listen({
      port: env.PORT,
      host: env.HOST,
    });
    server.log.info(`🚀 Orbito Backend Engine running at ${address}`);

    // Start automated daily puzzle scheduler and pre-provisioning
    const puzzleService = new DailyPuzzleService();
    puzzleService.startScheduler();
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];
  for (const signal of signals) {
    process.on(signal, async () => {
      server.log.info(`Received ${signal}. Shutting down gracefully...`);
      await server.close();
      await pool.end();
      await redis.quit();
      process.exit(0);
    });
  }
}

start();
