import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import { setupErrorHandler } from './plugins/error-handler.js';
import { setupRateLimiter } from './plugins/rate-limiter.js';
import { healthRoutes } from './routes/health.routes.js';
import { gameRoutes } from './routes/game.routes.js';
import { leaderboardRoutes } from './routes/leaderboard.routes.js';
import { authRoutes } from './routes/auth.routes.js';
import { communityRoutes } from './routes/community.routes.js';
import { env } from '../../config/env.js';

export async function buildServer(): Promise<FastifyInstance> {
  const server = fastify({
    logger: {
      level: env.LOG_LEVEL,
      transport:
        env.NODE_ENV === 'development'
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
    },
    disableRequestLogging: env.NODE_ENV === 'test',
  });

  // Core Plugins
  await server.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  await server.register(sensible);

  // Global Error Handler & Anti-cheat Rate Limiter
  setupErrorHandler(server);
  setupRateLimiter(server);

  // Register Routes
  await server.register(healthRoutes, { prefix: '/api/v1' });
  await server.register(gameRoutes, { prefix: '/api/v1' });
  await server.register(leaderboardRoutes, { prefix: '/api/v1' });
  await server.register(authRoutes, { prefix: '/api/v1' });
  await server.register(communityRoutes, { prefix: '/api/v1' });

  return server;
}
