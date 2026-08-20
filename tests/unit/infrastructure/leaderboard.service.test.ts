import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LeaderboardService } from '../../../src/infrastructure/cache/leaderboard.service.js';
import { redis } from '../../../src/infrastructure/cache/redis.js';

describe('Infrastructure: LeaderboardService (Redis Sorted Sets)', () => {
  let service: LeaderboardService;

  beforeEach(() => {
    service = new LeaderboardService();
  });

  it('should format global and environment keys correctly', () => {
    const serviceAny = service as any;
    expect(serviceAny.getGlobalKey('2026-08-20')).toBe('orbito:leaderboard:global:2026-08-20');
    expect(serviceAny.getEnvKey('team-1', '2026-08-20')).toBe('orbito:leaderboard:env:team-1:2026-08-20');
  });

  it('should parse Redis zrevrange results into ranked leaderboard entries', async () => {
    const mockZrevrange = vi.spyOn(redis, 'zrevrange').mockResolvedValue([
      'user-1:PlayerOne', '950',
      'user-2:PlayerTwo', '875',
      'user-3:PlayerThree', '720',
    ] as any);

    const leaderboard = await service.getGlobalLeaderboard('2026-08-20', 10);

    expect(leaderboard).toHaveLength(3);
    expect(leaderboard[0]).toEqual({
      rank: 1,
      userId: 'user-1',
      username: 'PlayerOne',
      score: 950,
    });
    expect(leaderboard[1]).toEqual({
      rank: 2,
      userId: 'user-2',
      username: 'PlayerTwo',
      score: 875,
    });
    expect(leaderboard[2]).toEqual({
      rank: 3,
      userId: 'user-3',
      username: 'PlayerThree',
      score: 720,
    });

    mockZrevrange.mockRestore();
  });

  it('should return 1-indexed user rank from zrevrank', async () => {
    const mockZrevrank = vi.spyOn(redis, 'zrevrank').mockResolvedValue(0 as any);

    const rank = await service.getUserRank('2026-08-20', 'user-1', 'PlayerOne');
    expect(rank).toBe(1);

    mockZrevrank.mockRestore();
  });
});
