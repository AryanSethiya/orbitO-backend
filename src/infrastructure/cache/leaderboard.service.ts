import { db } from '../database/index.js';
import { gameSessions } from '../database/schema/game-sessions.js';
import { users } from '../database/schema/users.js';
import { dailyPuzzles } from '../database/schema/puzzles.js';
import { eq, and, desc } from 'drizzle-orm';
import { redis } from './redis.js';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  name?: string;
  avatarUrl?: string;
  community: string;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  completedAt?: Date | string | null;
}

export class LeaderboardService {
  /**
   * Record a player's score to Redis Sorted Sets.
   */
  async recordScore(date: string, userId: string, username: string, score: number, community?: string): Promise<void> {
    try {
      const globalKey = `orbito:leaderboard:global:${date}`;
      const member = `${userId}:${username}`;
      await redis.zadd(globalKey, score, member);
      await redis.expire(globalKey, 30 * 24 * 60 * 60);

      if (community) {
        const commKey = `orbito:leaderboard:community:${encodeURIComponent(community)}:${date}`;
        await redis.zadd(commKey, score, member);
        await redis.expire(commKey, 30 * 24 * 60 * 60);
      }
    } catch {
      // Redis optional cache
    }
  }

  /**
   * Fetch 100% real pilots from PostgreSQL database (no hardcoded/fake entries).
   */
  async getGlobalLeaderboard(dateStr: string, limit = 50, communityFilter?: string, roomCode?: string): Promise<LeaderboardEntry[]> {
    // 1. Find puzzle for this date
    const puzzleList = await db
      .select({ id: dailyPuzzles.id })
      .from(dailyPuzzles)
      .where(eq(dailyPuzzles.date, dateStr))
      .limit(1);

    if (puzzleList.length === 0) {
      return [];
    }

    const puzzleId = puzzleList[0].id;

    // If roomCode provided, resolve room member userIds
    let roomUserIds: Set<string> | null = null;
    if (roomCode && roomCode.trim()) {
      try {
        const { communityRooms, communityMembers } = await import('../database/schema/community-rooms.js');
        const memberships = await db
          .select({ userId: communityMembers.userId })
          .from(communityMembers)
          .innerJoin(communityRooms, eq(communityMembers.roomId, communityRooms.id))
          .where(eq(communityRooms.code, roomCode.trim().toUpperCase()));
        
        roomUserIds = new Set(memberships.map(m => m.userId));
      } catch (err) {
        console.error('Error resolving room members for leaderboard:', err);
      }
    }

    // 2. Query completed sessions with user profile
    const query = db
      .select({
        sessionId: gameSessions.id,
        userId: gameSessions.userId,
        score: gameSessions.score,
        guessesCount: gameSessions.guessesCount,
        hintsUsed: gameSessions.hintsUsed,
        completedAt: gameSessions.completedAt,
        username: users.username,
        name: users.name,
        avatarUrl: users.avatarUrl,
        community: users.community,
      })
      .from(gameSessions)
      .innerJoin(users, eq(gameSessions.userId, users.id))
      .where(
        and(
          eq(gameSessions.puzzleId, puzzleId),
          eq(gameSessions.solved, true)
        )
      )
      .orderBy(desc(gameSessions.score), gameSessions.completedAt)
      .limit(limit);

    const rows = await query;

    // Filter by roomCode or community if requested
    let filteredRows = rows;
    if (roomUserIds) {
      filteredRows = rows.filter(r => roomUserIds!.has(r.userId));
    } else if (communityFilter && communityFilter !== 'All' && communityFilter !== 'Global') {
      filteredRows = rows.filter((r) => r.community?.toLowerCase() === communityFilter.toLowerCase());
    }

    return filteredRows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      username: row.name || row.username || 'Orbital Pilot',
      name: row.name || row.username,
      avatarUrl: row.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(row.username)}`,
      community: row.community || 'Global Explorers',
      score: row.score,
      guessesCount: row.guessesCount,
      hintsUsed: row.hintsUsed,
      completedAt: row.completedAt,
    }));
  }

  /**
   * Get distinct active user communities and custom rooms.
   */
  async getActiveCommunities(): Promise<string[]> {
    try {
      const distinctCommunities = await db
        .selectDistinct({ community: users.community })
        .from(users);

      const set = new Set<string>();
      for (const item of distinctCommunities) {
        if (item.community && item.community.trim() && item.community !== 'Global Explorers') {
          set.add(item.community.trim());
        }
      }
      return Array.from(set);
    } catch {
      return [];
    }
  }
}
