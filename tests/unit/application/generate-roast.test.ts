import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GenerateRoastUseCase } from '../../../src/application/use-cases/generate-roast.use-case.js';
import { GameNotSolvedError, SessionNotFoundError } from '../../../src/core/errors/domain-errors.js';

describe('Application: GenerateRoastUseCase', () => {
  let mockSessionRepo: any;
  let mockPuzzleRepo: any;
  let mockRoastRepo: any;
  let mockGeminiClient: any;
  let useCase: GenerateRoastUseCase;

  beforeEach(() => {
    mockSessionRepo = {
      findById: vi.fn(),
      getSessionGuesses: vi.fn(),
    };
    mockPuzzleRepo = {
      findById: vi.fn(),
    };
    mockRoastRepo = {
      findBySessionId: vi.fn(),
      saveRoast: vi.fn(),
    };
    mockGeminiClient = {
      generateRoast: vi.fn(),
    };

    useCase = new GenerateRoastUseCase(
      mockSessionRepo,
      mockPuzzleRepo,
      mockRoastRepo,
      mockGeminiClient
    );
  });

  it('should throw SessionNotFoundError if session does not exist', async () => {
    mockSessionRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ sessionId: 'dummy-id' })
    ).rejects.toThrow(SessionNotFoundError);
  });

  it('should reject roast generation if game is not yet solved', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      solved: false,
    });

    await expect(
      useCase.execute({ sessionId: 's1' })
    ).rejects.toThrow(GameNotSolvedError);
  });

  it('should return cached roast without calling LLM if already generated', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      solved: true,
    });
    mockRoastRepo.findBySessionId.mockResolvedValue({
      gameSessionId: 's1',
      roastText: 'Cached hilarious roast text.',
      roastStyle: 'savage',
    });

    const result = await useCase.execute({ sessionId: 's1' });

    expect(result.cached).toBe(true);
    expect(result.roastText).toBe('Cached hilarious roast text.');
    expect(mockGeminiClient.generateRoast).not.toHaveBeenCalled();
  });

  it('should generate, save, and return a new roast for a solved session', async () => {
    mockSessionRepo.findById.mockResolvedValue({
      id: 's1',
      puzzleId: 'p1',
      solved: true,
      score: 850,
      guessesCount: 10,
      hintsUsed: 1,
    });
    mockRoastRepo.findBySessionId.mockResolvedValue(null);
    mockPuzzleRepo.findById.mockResolvedValue({
      id: 'p1',
      targetWordId: 'airport',
    });
    mockSessionRepo.getSessionGuesses.mockResolvedValue([
      { word: 'flight', rank: 50 },
      { word: 'airport', rank: 1 },
    ]);
    mockGeminiClient.generateRoast.mockResolvedValue(
      'You went straight from flight to airport. Clean landing!'
    );
    mockRoastRepo.saveRoast.mockResolvedValue({
      gameSessionId: 's1',
      roastText: 'You went straight from flight to airport. Clean landing!',
      roastStyle: 'hype',
    });

    const result = await useCase.execute({ sessionId: 's1', style: 'hype' });

    expect(result.cached).toBe(false);
    expect(result.roastText).toContain('Clean landing!');
    expect(mockRoastRepo.saveRoast).toHaveBeenCalled();
  });
});
