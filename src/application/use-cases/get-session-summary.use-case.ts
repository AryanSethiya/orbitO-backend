import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import { calculateFinalScore } from '../../core/services/scoring-calculator.js';
import { SessionNotFoundError, PuzzleNotFoundError } from '../../core/errors/domain-errors.js';

export interface SessionSummaryResult {
  sessionId: string;
  puzzleDate: string;
  puzzleDifficulty: string;
  solved: boolean;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  revealedHints: string[];
  bestRank: number | null;
  startedAt: Date;
  completedAt: Date | null;
  guesses: Array<{
    id: string;
    word: string;
    normalizedWord: string;
    rank: number;
    semanticScore: number;
    signal: {
      tier: string;
      label: string;
      emoji: string;
      rank: number;
    };
    createdAt: Date;
  }>;
}

export class GetSessionSummaryUseCase {
  constructor(
    private sessionRepo: GameSessionRepository,
    private puzzleRepo: PuzzleRepository
  ) {}

  async execute(sessionId: string): Promise<SessionSummaryResult> {
    const session = await this.sessionRepo.findById(sessionId);
    if (!session) {
      throw new SessionNotFoundError(sessionId);
    }

    const puzzle = await this.puzzleRepo.findById(session.puzzleId);
    if (!puzzle) {
      throw new PuzzleNotFoundError('associated');
    }

    const guesses = await this.sessionRepo.getSessionGuesses(sessionId);

    // Collect revealed hints based on hintsUsed
    const revealedHints: string[] = [];
    if (session.hintsUsed >= 1) revealedHints.push(puzzle.hint1);
    if (session.hintsUsed >= 2) revealedHints.push(puzzle.hint2);
    if (session.hintsUsed >= 3) revealedHints.push(puzzle.hint3);

    // Compute best rank
    const bestRank = guesses.length > 0
      ? Math.min(...guesses.map((g) => g.rank))
      : null;

    // Recalculate score if solved
    const currentScore = session.solved
      ? session.score
      : calculateFinalScore(session.guessesCount, session.hintsUsed).finalScore;

    return {
      sessionId: session.id,
      puzzleDate: puzzle.date,
      puzzleDifficulty: puzzle.difficulty,
      solved: session.solved,
      score: currentScore,
      guessesCount: session.guessesCount,
      hintsUsed: session.hintsUsed,
      revealedHints,
      bestRank,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      guesses,
    };
  }
}
