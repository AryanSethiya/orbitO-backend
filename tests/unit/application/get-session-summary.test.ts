import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GetSessionSummaryUseCase } from '../../../src/application/use-cases/get-session-summary.use-case.js';
import { SessionNotFoundError } from '../../../src/core/errors/domain-errors.js';

describe('Application: GetSessionSummaryUseCase', () => {
  let mockSessionRepo: any;
  let mockPuzzleRepo: any;
  let useCase: GetSessionSummaryUseCase;

  beforeEach(() => {
    mockSessionRepo = {
      findById: vi.fn(),
      getSessionGuesses: vi.fn(),
    };
    mockPuzzleRepo = {
      findById: vi.fn(),
    };
    useCase = new GetSessionSummaryUseCase(mockSessionRepo, mockPuzzleRepo);
  });

  it('should throw SessionNotFoundError if session missing', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(useCase.execute('missing-id')).rejects.toThrow(SessionNotFoundError);
  });

  it('should compile complete session summary, score, and revealed hints', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      score: 0,
      guessesCount: 5,
      hintsUsed: 2,
      startedAt: new Date('2026-08-20T10:00:00Z'),
      completedAt: null,
    });

    mockPuzzleRepo.findById.mockResolvedValue({
      id: 'p1',
      date: '2026-08-20',
      difficulty: 'medium',
      hint1: 'Hint 1 text',
      hint2: 'Hint 2 text',
      hint3: 'Hint 3 text',
    });

    mockSessionRepo.getSessionGuesses.mockResolvedValue([
      {
        id: 'g1',
        word: 'planet',
        normalizedWord: 'planet',
        rank: 500,
        semanticScore: 0.45,
        signal: { tier: 'WARM', label: 'Warm', emoji: '🌡️', rank: 500 },
        createdAt: new Date('2026-08-20T10:01:00Z'),
      },
      {
        id: 'g2',
        word: 'flight',
        normalizedWord: 'flight',
        rank: 25,
        semanticScore: 0.88,
        signal: { tier: 'VERY_HOT', label: 'Very Hot', emoji: '🔥🔥', rank: 25 },
        createdAt: new Date('2026-08-20T10:02:00Z'),
      },
    ]);

    const summary = await useCase.execute('s1');

    expect(summary.sessionId).toBe('s1');
    expect(summary.puzzleDate).toBe('2026-08-20');
    expect(summary.puzzleDifficulty).toBe('medium');
    expect(summary.bestRank).toBe(25);
    expect(summary.guessesCount).toBe(5);
    expect(summary.hintsUsed).toBe(2);
    expect(summary.revealedHints).toEqual(['Hint 1 text', 'Hint 2 text']);
    // 1000 - (5 * 5 = 25) - (100 + 200 = 300) = 675
    expect(summary.score).toBe(675);
    expect(summary.guesses).toHaveLength(2);
  });
});
