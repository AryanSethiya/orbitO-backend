import { redis } from './redis.js';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  score: number;
}

export class LeaderboardService {
  /**
   * Redis Key Formats:
   * Global: orbito:leaderboard:global:YYYY-MM-DD
   * Environment: orbito:leaderboard:env:{envId}:YYYY-MM-DD
   */
  private getGlobalKey(date: string): string {
    return `orbito:leaderboard:global:${date}`;
  }

  private getEnvKey(envId: string, date: string): string {
    return `orbito:leaderboard:env:${envId}:${date}`;
  }

  /**
   * Record a player's score to Redis Sorted Sets.
   * Redis ZADD stores score as double, member as "userId:username".
   */
  async recordScore(date: string, userId: string, username: string, score: number, envIds: string[] = []): Promise<void> {
    const member = `${userId}:${username}`;

    try {
      // 1. Global Leaderboard
      const globalKey = this.getGlobalKey(date);
      await redis.zadd(globalKey, score, member);
      // Expire after 30 days to save memory
      await redis.expire(globalKey, 30 * 24 * 60 * 60);

      // 2. Private Environment Leaderboards
      for (const envId of envIds) {
        const envKey = this.getEnvKey(envId, date);
        await redis.zadd(envKey, score, member);
        await redis.expire(envKey, 30 * 24 * 60 * 60);
      }
    } catch {
      // If Redis is temporarily unreachable, fail gracefully (PostgreSQL is source of truth)
    }
  }

  /**
   * Get top N players on the global leaderboard for a date.
   */
  async getGlobalLeaderboard(date: string, limit = 50): Promise<LeaderboardEntry[]> {
    try {
      const key = this.getGlobalKey(date);
      // ZREVRANGE key 0 limit-1 WITHSCORES
      const rawResults = await redis.zrevrange(key, 0, limit - 1, 'WITHSCORES');
      const entries: LeaderboardEntry[] = [];

      for (let i = 0; i < rawResults.length; i += 2) {
        const member = rawResults[i];
        const score = parseFloat(rawResults[i + 1]);
        const [userId, username] = member.split(':');

        entries.push({
          rank: entries.length + 1,
          userId,
          username: username || 'Anonymous Orbit Player',
          score,
        });
      }

      return entries;
    } catch {
      return [];
    }
  }

  /**
   * Get specific user's rank on global leaderboard.
   */
  async getUserRank(date: string, userId: string, username: string): Promise<number | null> {
    try {
      const key = this.getGlobalKey(date);
      const member = `${userId}:${username}`;
      const zeroIndexedRank = await redis.zrevrank(key, member);

      if (zeroIndexedRank === null || zeroIndexedRank === undefined) {
        return null;
      }

      return zeroIndexedRank + 1;
    } catch {
      return null;
    }
  }
}
