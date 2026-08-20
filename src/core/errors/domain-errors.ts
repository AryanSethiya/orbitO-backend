export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class PuzzleNotFoundError extends DomainError {
  constructor(date: string) {
    super(`No active puzzle found for date: ${date}`);
  }
}

export class SessionNotFoundError extends DomainError {
  constructor(sessionId: string) {
    super(`Game session not found: ${sessionId}`);
  }
}

export class SessionAlreadyCompletedError extends DomainError {
  constructor(sessionId: string) {
    super(`Game session ${sessionId} is already completed.`);
  }
}

export class UnknownWordError extends DomainError {
  constructor(word: string) {
    super(`We don't know the word "${word}" yet. Try another word!`);
  }
}

export class InvalidGuessError extends DomainError {
  constructor(reason: string) {
    super(`Invalid guess: ${reason}`);
  }
}

export class HintLimitExceededError extends DomainError {
  constructor(currentHints: number) {
    super(`Cannot request hint. Maximum 3 hints allowed (current: ${currentHints}).`);
  }
}

export class GameNotSolvedError extends DomainError {
  constructor(message = 'Cannot perform action: game session has not been solved yet.') {
    super(message);
  }
}
