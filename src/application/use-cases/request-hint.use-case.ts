import { GameSessionRepository } from '../../infrastructure/database/repositories/game-session.repository.js';
import { PuzzleRepository } from '../../infrastructure/database/repositories/puzzle.repository.js';
import {
  SessionNotFoundError,
  SessionAlreadyCompletedError,
  HintLimitExceededError,
  PuzzleNotFoundError,
} from '../../core/errors/domain-errors.js';
import { env } from '../../config/env.js';

export interface RequestHintCommand {
  sessionId: string;
}

export interface RequestHintResult {
  hintNumber: number;
  hintText: string;
  hintsUsed: number;
  remainingHints: number;
  penaltyCost: number;
}

export class RequestHintUseCase {
  constructor(
    private sessionRepo: GameSessionRepository,
    private puzzleRepo: PuzzleRepository
  ) {}

  async execute(command: RequestHintCommand): Promise<RequestHintResult> {
    const session = await this.sessionRepo.findById(command.sessionId);
    if (!session) {
      throw new SessionNotFoundError(command.sessionId);
    }

    if (session.solved) {
      throw new SessionAlreadyCompletedError(command.sessionId);
    }

    if (session.hintsUsed >= 3) {
      throw new HintLimitExceededError(session.hintsUsed);
    }

    const puzzle = await this.puzzleRepo.findById(session.puzzleId);
    if (!puzzle) {
      throw new PuzzleNotFoundError('current');
    }

    const nextHintNumber = session.hintsUsed + 1;
    let hintText = '';
    let penaltyCost = 0;

    if (nextHintNumber === 1) {
      hintText = puzzle.hint1;
      penaltyCost = env.HINT_1_PENALTY;
    } else if (nextHintNumber === 2) {
      hintText = puzzle.hint2;
      penaltyCost = env.HINT_2_PENALTY;
    } else if (nextHintNumber === 3) {
      hintText = puzzle.hint3;
      penaltyCost = env.HINT_3_PENALTY;
    }

    // Increment hint count in DB
    await this.sessionRepo.incrementHints(session.id);

    return {
      hintNumber: nextHintNumber,
      hintText,
      hintsUsed: nextHintNumber,
      remainingHints: 3 - nextHintNumber,
      penaltyCost,
    };
  }
}
