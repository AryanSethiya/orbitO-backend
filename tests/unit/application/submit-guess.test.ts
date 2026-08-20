import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SubmitGuessUseCase } from '../../../src/application/use-cases/submit-guess.use-case.js';
import {
  UnknownWordError,
  SessionAlreadyCompletedError,
  SessionNotFoundError,
} from '../../../src/core/errors/domain-errors.js';

describe('Application: SubmitGuessUseCase', () => {
  let mockSessionRepo: any;
  let mockPuzzleRepo: any;
  let mockVocabRepo: any;
  let useCase: SubmitGuessUseCase;

  beforeEach(() => {
    mockSessionRepo = {
      findById: vi.fn(),
      recordGuess: vi.fn(),
      completeSession: vi.fn(),
    };
    mockPuzzleRepo = {
      getRankForWord: vi.fn(),
      findById: vi.fn().mockResolvedValue({ id: 'p1', date: '2026-08-20' }),
    };
    mockVocabRepo = {
      findByNormalizedWord: vi.fn(),
    };

    useCase = new SubmitGuessUseCase(mockSessionRepo, mockPuzzleRepo, mockVocabRepo);
  });

  it('should throw SessionNotFoundError if session does not exist', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionId: 'dummy-id', guess: 'flight' })
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('should throw SessionAlreadyCompletedError if session is already solved', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      solved: true,
      guessesCount: 5,
    });

    await expect(
      useCase.execute({ sessionId: 's1', guess: 'flight' })
    ).rejects.toThrow(SessionAlreadyCompletedError);
  });

  it('should throw UnknownWordError if word is not in vocabulary', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      guessesCount: 2,
      hintsUsed: 0,
    });
    mockVocabRepo.findByNormalizedWord.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionId: 's1', guess: 'xyznotaword' })
    ).rejects.toThrow(UnknownWordError);
  });

  it('should return rank and proximity signal for a valid guess', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      guessesCount: 2,
      hintsUsed: 0,
    });
    mockVocabRepo.findByNormalizedWord.mockResolvedValue({
      id: 'w1',
      word: 'flight',
      normalizedWord: 'flight',
    });
    mockPuzzleRepo.getRankForWord.mockResolvedValue({
      puzzleId: 'p1',
      wordId: 'w1',
      semanticScore: 0.85,
      rank: 42,
    });

    const result = await useCase.execute({ sessionId: 's1', guess: 'flight' });

    expect(result.rank).toBe(42);
    expect(result.semanticScore).toBe(0.85);
    expect(result.signal.tier).toBe('VERY_HOT');
    expect(result.isSolved).toBe(false);
    expect(result.guessesCount).toBe(3);
    expect(mockSessionRepo.recordGuess).toHaveBeenCalledWith('s1', 'w1', 0.85, 42);
  });

  it('should complete session and calculate final score when Rank 1 is found', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      guessesCount: 9,
      hintsUsed: 1,
    });
    mockVocabRepo.findByNormalizedWord.mockResolvedValue({
      id: 'w-target',
      word: 'airport',
      normalizedWord: 'airport',
    });
    mockPuzzleRepo.getRankForWord.mockResolvedValue({
      puzzleId: 'p1',
      wordId: 'w-target',
      semanticScore: 1.0,
      rank: 1,
    });

    const result = await useCase.execute({ sessionId: 's1', guess: 'airport' });

    expect(result.rank).toBe(1);
    expect(result.isSolved).toBe(true);
    expect(result.signal.tier).toBe('CENTER');
    expect(result.scoreBreakdown).not.toBeNull();
    // 1000 - (10 guesses * 5) - (1 hint * 100) = 850
    expect(result.scoreBreakdown?.finalScore).toBe(850);
    expect(mockSessionRepo.completeSession).toHaveBeenCalledWith('s1', 850);
  });
});
