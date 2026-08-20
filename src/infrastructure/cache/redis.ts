import { Redis } from 'ioredis';
import { env } from '../../config/env.js';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 1,
  enableReadyCheck: false,
  lazyConnect: true,
  retryStrategy: () => null, // don't loop endlessly when Redis is offline in tests
});

redis.on('error', () => {
  // Silent fallback for testing / offline environments
});

export async function checkRedisHealth(): Promise<boolean> {
  try {
    const status = await redis.ping();
    return status === 'PONG';
  } catch (error) {
    return false;
  }
}
