import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { pool } from '../../../infrastructure/database/index.js';
import { checkRedisHealth } from '../../../infrastructure/cache/redis.js';

export const healthRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  server.get('/health', async (_request, reply) => {
    let dbHealthy = false;
    let redisHealthy = false;

    try {
      const dbRes = await pool.query('SELECT 1');
      dbHealthy = dbRes.rowCount === 1;
    } catch {
      dbHealthy = false;
    }

    try {
      redisHealthy = await checkRedisHealth();
    } catch {
      redisHealthy = false;
    }

    const isHealthy = dbHealthy && redisHealthy;
    const status = isHealthy ? 'ok' : 'degraded';

    return reply.status(isHealthy ? 200 : 503).send({
      status,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealthy ? 'healthy' : 'unreachable',
        redis: redisHealthy ? 'healthy' : 'unreachable',
      },
    });
  });
};
