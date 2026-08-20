import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RequestHintUseCase } from '../../../src/application/use-cases/request-hint.use-case.js';
import { HintLimitExceededError, SessionAlreadyCompletedError } from '../../../src/core/errors/domain-errors.js';

describe('Application: RequestHintUseCase', () => {
  let mockSessionRepo: any;
  let mockPuzzleRepo: any;
  let useCase: RequestHintUseCase;

  beforeEach(() => {
    mockSessionRepo = {
      findById: vi.fn(),
      incrementHints: vi.fn(),
    };
    mockPuzzleRepo = {
      findById: vi.fn(),
    };
    useCase = new RequestHintUseCase(mockSessionRepo, mockPuzzleRepo);
  });

  it('should deliver Hint 1 with 100 penalty', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      hintsUsed: 0,
    });
    mockPuzzleRepo.findById.mockResolvedValue({
      id: 'p1',
      hint1: 'Travel hub clue',
      hint2: 'Luggage clue',
      hint3: 'Planes clue',
    });

    const result = await useCase.execute({ sessionId: 's1' });

    expect(result.hintNumber).toBe(1);
    expect(result.hintText).toBe('Travel hub clue');
    expect(result.penaltyCost).toBe(100);
    expect(result.remainingHints).toBe(2);
    expect(mockSessionRepo.incrementHints).toHaveBeenCalledWith('s1');
  });

  it('should deliver Hint 2 with 200 penalty', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      hintsUsed: 1,
    });
    mockPuzzleRepo.findById.mockResolvedValue({
      id: 'p1',
      hint1: 'Travel hub clue',
      hint2: 'Luggage clue',
      hint3: 'Planes clue',
    });

    const result = await useCase.execute({ sessionId: 's1' });

    expect(result.hintNumber).toBe(2);
    expect(result.hintText).toBe('Luggage clue');
    expect(result.penaltyCost).toBe(200);
    expect(result.remainingHints).toBe(1);
  });

  it('should throw HintLimitExceededError if 3 hints have already been used', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: false,
      hintsUsed: 3,
    });

    await expect(useCase.execute({ sessionId: 's1' })).rejects.toThrow(HintLimitExceededError);
  });

  it('should throw SessionAlreadyCompletedError if game is solved', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      solved: true,
      hintsUsed: 1,
    });

    await expect(useCase.execute({ sessionId: 's1' })).rejects.toThrow(SessionAlreadyCompletedError);
  });
});
