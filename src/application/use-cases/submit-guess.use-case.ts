import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { VocabularyRepository } from '../../infrastructure/database/repositories/vocabulary.repository.js';
import { LeaderboardService } from '../../infrastructure/cache/leaderboard.service.js';
import { normalizeWord } from '../../core/services/word-normalizer.js';
import { getProximitySignal, ProximitySignal } from '../../core/services/proximity-classifier.js';
import { calculateFinalScore, ScoreCalculationResult } from '../../core/services/scoring-calculator.js';
import {
  SessionNotFoundError,
  SessionAlreadyCompletedError,
  UnknownWordError,
} from '../../core/errors/domain-errors.js';

export interface SubmitGuessCommand {
  sessionId: string;
  guess: string;
  username?: string;
}

export interface SubmitGuessResult {
  word: string;
  normalizedWord: string;
  rank: number;
  semanticScore: number;
  signal: ProximitySignal;
  guessesCount: number;
  isSolved: boolean;
  scoreBreakdown: ScoreCalculationResult | null;
}

export class SubmitGuessUseCase {
  constructor(
    private sessionRepo: GameSessionRepository,
    private puzzleRepo: PuzzleRepository,
    private vocabRepo: VocabularyRepository,
    private leaderboardService: LeaderboardService = new LeaderboardService()
  ) {}

  async execute(command: SubmitGuessCommand): Promise<SubmitGuessResult> {
    // 1. Retrieve session
    const session = await this.sessionRepo.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }

    if (session.solved) {
      throw new SessionAlreadyCompletedError(command.sessionId);
    }

    // 2. Normalize guess
    const normalized = normalizeWord(command.guess);

    // 3. Verify vocabulary membership
    const vocabWord = await this.vocabRepo.findByNormalizedWord(normalized);
    if (!vocabWord) {
      throw new UnknownWordError(command.guess);
    }

    // 4. Instant Rank Lookup
    const rankedWord = await this.puzzleRepo.getRankForWord(session.puzzleId, vocabWord.id);
    if (!rankedWord) {
      throw new Error(`Word "${normalized}" is not ranked for this puzzle.`);
    }

    // 5. Record Guess
    await this.sessionRepo.recordGuess(
      session.id,
      vocabWord.id,
      rankedWord.semanticScore,
      rankedWord.rank
    );

    const updatedGuessCount = session.guessesCount + 1;
    const signal = getProximitySignal(rankedWord.rank);
    const isSolved = rankedWord.rank === 1;

    let scoreBreakdown: ScoreCalculationResult | null = null;

    // 6. If solved (Rank #1), complete session and lock final score
    if (isSolved) {
      scoreBreakdown = calculateFinalScore(updatedGuessCount, session.hintsUsed);
      await this.sessionRepo.completeSession(session.id, scoreBreakdown.finalScore);

      // Record to Redis leaderboard
      const puzzle = await this.puzzleRepo.findById(session.puzzleId);
      if (puzzle) {
        await this.leaderboardService.recordScore(
          puzzle.date,
          session.userId,
          command.username || 'Anonymous Explorer',
          scoreBreakdown.finalScore
        );
      }
    }

    return {
      word: vocabWord.word,
      normalizedWord: normalized,
      rank: rankedWord.rank,
      semanticScore: rankedWord.semanticScore,
      signal,
      guessesCount: updatedGuessCount,
      isSolved,
      scoreBreakdown,
    };
  }
}
