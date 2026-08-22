import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { AIRoastRepository } from '../../infrastructure/database/repositories/ai-roast.repository.js';
import { IGeminiClient } from '../../infrastructure/ai/gemini-client.js';
import { redis } from '../../infrastructure/cache/redis.js';
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

    const redisKey = `roast:${session.id}`;

    // 1. Check ultra-fast Redis cache first
    try {
      const cachedInRedis = await redis.get(redisKey);
      if (cachedInRedis) {
        return {
          sessionId: session.id,
          roastText: cachedInRedis,
          roastStyle: command.style || 'savage',
          cached: true,
        };
      }
    } catch {}

    // 2. Return cached roast from DB if already generated
    const existing = await this.roastRepo.findBySessionId(session.id);
    if (existing) {
      try {
        await redis.setex(redisKey, 86400, existing.roastText);
      } catch {}
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
      targetWord: puzzle?.targetWord || 'Secret Center',
      guessesCount: session.guessesCount,
      hintsUsed: session.hintsUsed,
      finalScore: session.score,
      guessesJourney: guesses.map((g) => ({ word: g.word, rank: g.rank })),
      style: command.style || 'balanced',
    });

    // 4. Persist to DB and Redis
    const saved = await this.roastRepo.saveRoast({
      gameSessionId: session.id,
      roastText,
      roastStyle: command.style || 'savage',
    });

    try {
      await redis.setex(redisKey, 86400, saved.roastText);
    } catch {}

    return {
      sessionId: session.id,
      roastText: saved.roastText,
      roastStyle: saved.roastStyle,
      cached: false,
    };
  }
}
