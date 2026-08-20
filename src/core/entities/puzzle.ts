export interface DailyPuzzleEntity {
  id: string;
  date: string; // YYYY-MM-DD
  targetWordId: string;
  vocabularyVersion: string;
  hint1: string;
  hint2: string;
  hint3: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
}

export interface VocabularyWordEntity {
  id: string;
  word: string;
  normalizedWord: string;
  vocabularyVersion: string;
  isActive: boolean;
}

export interface PuzzleWordRankEntity {
  id: string;
  puzzleId: string;
  wordId: string;
  semanticScore: number;
  rank: number;
}
