import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { LeaderboardService } from '../../../infrastructure/cache/leaderboard.service.js';

const leaderboardQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  community: z.string().optional(),
  roomCode: z.string().optional(),
});

export const leaderboardRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const leaderboardService = new LeaderboardService();

  /**
   * GET /api/v1/leaderboards/daily
   * Fetch real-time global, community, & custom room leaderboard from PostgreSQL & Redis
   */
  server.get('/leaderboards/daily', async (request, reply) => {
    const query = leaderboardQuerySchema.parse(request.query);
    const dateStr = query.date || new Date().toISOString().split('T')[0];

    const entries = await leaderboardService.getGlobalLeaderboard(
      dateStr,
      query.limit,
      query.community,
      query.roomCode
    );

    return reply.status(200).send({
      date: dateStr,
      community: query.roomCode ? `Room ${query.roomCode}` : query.community || 'Global',
      roomCode: query.roomCode,
      totalEntries: entries.length,
      leaderboard: entries,
    });
  });

  /**
   * GET /api/v1/leaderboards/communities
   * Fetch active communities
   */
  server.get('/leaderboards/communities', async (_request, reply) => {
    const communities = await leaderboardService.getActiveCommunities();
    return reply.status(200).send({ communities });
  });
};
