import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { AIRoastRepository } from '../../infrastructure/database/repositories/ai-roast.repository.js';
import { IGeminiClient } from '../../infrastructure/ai/gemini-client.js';
import { SessionNotFoundError, GameNotSolvedError } from '../../core/errors/domain-errors.js';

export interface GenerateRoastCommand {
  sessionId: string;
  style?: 'friendly' | 'savage' | 'hype' | 'balanced';
}

export interface GenerateRoastResult {
  sessionId: string;
  roastText: string;
  roastStyle: string;
  cached: boolean;
}

export class GenerateRoastUseCase {
  constructor(
    private sessionRepo: GameSessionRepository,
    private puzzleRepo: PuzzleRepository,
    private roastRepo: AIRoastRepository,
    private geminiClient: IGeminiClient
  ) {}

  async execute(command: GenerateRoastCommand): Promise<GenerateRoastResult> {
    const session = await this.sessionRepo.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }

    if (!session.solved) {
      throw new GameNotSolvedError();
    }

    // 1. Return cached roast if already generated
    const existing = await this.roastRepo.findBySessionId(session.id);
    if (existing) {
      return {
        sessionId: session.id,
        roastText: existing.roastText,
        roastStyle: existing.roastStyle,
        cached: true,
      };
    }

    // 2. Fetch puzzle & guess journey
    const puzzle = await this.puzzleRepo.findById(session.puzzleId);
    const guesses = await this.sessionRepo.getSessionGuesses(session.id);

    // 3. Generate grounded roast via Gemini
    const roastText = await this.geminiClient.generateRoast({
      targetWord: puzzle?.targetWordId || 'Secret Center',
      guessesCount: session.guessesCount,
      hintsUsed: session.hintsUsed,
      finalScore: session.score,
      guessesJourney: guesses.map((g) => ({ word: g.word, rank: g.rank })),
      style: command.style || 'balanced',
    });

    // 4. Persist to DB
    const saved = await this.roastRepo.saveRoast({
      gameSessionId: session.id,
      roastText,
      roastStyle: command.style || 'balanced',
    });

    return {
      sessionId: session.id,
      roastText: saved.roastText,
      roastStyle: saved.roastStyle,
      cached: false,
    };
  }
}
