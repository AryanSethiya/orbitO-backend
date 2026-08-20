import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitOptions {
  maxRequests: number; // e.g. 30 requests
  windowMs: number;    // e.g. 60,000 ms (1 minute)
}

const defaultOptions: RateLimitOptions = {
  maxRequests: 30,
  windowMs: 60 * 1000,
};

// In-memory sliding window store
const clientWindows = new Map<string, number[]>();

export function setupRateLimiter(server: FastifyInstance, options = defaultOptions) {
  server.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Only rate-limit guess submissions
    const path = request.routeOptions?.url || request.url;
    if (path && path.includes('/guess') && request.method === 'POST') {
      const clientKey = request.ip || 'unknown';
      const now = Date.now();
      const timestamps = clientWindows.get(clientKey) || [];

      // Filter out timestamps older than the window
      const validTimestamps = timestamps.filter((time) => now - time < options.windowMs);

      if (validTimestamps.length >= options.maxRequests) {
        return reply.status(429).send({
          statusCode: 429,
          error: 'Too Many Requests',
          message: `Guess rate limit exceeded. Please wait a moment before trying again (limit: ${options.maxRequests} guesses/minute).`,
        });
      }

      validTimestamps.push(now);
      clientWindows.set(clientKey, validTimestamps);
    }
  });
}
