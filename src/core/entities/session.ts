import { ProximitySignal } from '../services/proximity-classifier.js';

export interface GuessEntity {
  id: string;
  gameSessionId: string;
  wordId: string;
  word: string;
  semanticScore: number;
  rank: number;
  signal: ProximitySignal;
  createdAt: Date;
}

export interface GameSessionEntity {
  id: string;
  userId: string;
  puzzleId: string;
  startedAt: Date;
  completedAt: Date | null;
  score: number;
  guessesCount: number;
  hintsUsed: number;
  solved: boolean;
}
