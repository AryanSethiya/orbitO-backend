import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { LeaderboardService } from '../../../infrastructure/cache/leaderboard.service.js';

const leaderboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
});

export const leaderboardRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const leaderboardService = new LeaderboardService();

  /**
   * GET /api/v1/leaderboards/daily
   * Fetch real-time global daily leaderboard from Redis
   */
  server.get('/leaderboards/daily', async (request, reply) => {
    const query = leaderboardQuerySchema.parse(request.query);
    const dateStr = query.date || new Date().toISOString().split('T')[0];

    const entries = await leaderboardService.getGlobalLeaderboard(dateStr, query.limit);

    return reply.status(200).send({
      date: dateStr,
      totalEntries: entries.length,
      leaderboard: entries,
    });
  });
};
