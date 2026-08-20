import { eq, and } from 'drizzle-orm';
import { db } from '../index.js';
import { dailyPuzzles } from '../schema/puzzles.js';
import { puzzleWords } from '../schema/puzzle-words.js';
import { vocabulary } from '../schema/vocabulary.js';

export interface CreatePuzzleInput {
  date: string; // YYYY-MM-DD
  targetWordId: string;
  vocabularyVersion?: string;
  hint1: string;
  hint2: string;
  hint3: string;
  difficulty?: string;
  status?: string;
}

export interface InsertPuzzleWordRank {
  puzzleId: string;
  wordId: string;
  semanticScore: number;
  rank: number;
}

export class PuzzleRepository {
  /**
   * Create a new daily puzzle entry.
   */
  async createDailyPuzzle(input: CreatePuzzleInput) {
    const results = await db
      .insert(dailyPuzzles)
      .values({
        date: input.date,
        targetWordId: input.targetWordId,
        vocabularyVersion: input.vocabularyVersion || 'v1',
        hint1: input.hint1,
        hint2: input.hint2,
        hint3: input.hint3,
        difficulty: input.difficulty || 'medium',
        status: input.status || 'published',
      })
      .returning();

    return results[0];
  }

  /**
   * Find puzzle by specific calendar date.
   */
  async findByDate(date: string) {
    const results = await db
      .select({
        id: dailyPuzzles.id,
        date: dailyPuzzles.date,
        targetWordId: dailyPuzzles.targetWordId,
        targetWord: vocabulary.word,
        targetNormalizedWord: vocabulary.normalizedWord,
        vocabularyVersion: dailyPuzzles.vocabularyVersion,
        hint1: dailyPuzzles.hint1,
        hint2: dailyPuzzles.hint2,
        hint3: dailyPuzzles.hint3,
        difficulty: dailyPuzzles.difficulty,
        status: dailyPuzzles.status,
        createdAt: dailyPuzzles.createdAt,
      })
      .from(dailyPuzzles)
      .innerJoin(vocabulary, eq(dailyPuzzles.targetWordId, vocabulary.id))
      .where(eq(dailyPuzzles.date, date))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find puzzle by ID.
   */
  async findById(id: string) {
    const results = await db
      .select({
        id: dailyPuzzles.id,
        date: dailyPuzzles.date,
        targetWordId: dailyPuzzles.targetWordId,
        targetWord: vocabulary.word,
        targetNormalizedWord: vocabulary.normalizedWord,
        vocabularyVersion: dailyPuzzles.vocabularyVersion,
        hint1: dailyPuzzles.hint1,
        hint2: dailyPuzzles.hint2,
        hint3: dailyPuzzles.hint3,
        difficulty: dailyPuzzles.difficulty,
        status: dailyPuzzles.status,
        createdAt: dailyPuzzles.createdAt,
      })
      .from(dailyPuzzles)
      .innerJoin(vocabulary, eq(dailyPuzzles.targetWordId, vocabulary.id))
      .where(eq(dailyPuzzles.id, id))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Batch insert precomputed ranks for a puzzle.
   */
  async batchInsertPuzzleWords(items: InsertPuzzleWordRank[], chunkSize = 500) {
    if (items.length === 0) return;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db
        .insert(puzzleWords)
        .values(
          chunk.map((item) => ({
            puzzleId: item.puzzleId,
            wordId: item.wordId,
            semanticScore: item.semanticScore,
            rank: item.rank,
          }))
        )
        .onConflictDoNothing();
    }
  }

  /**
   * Sub-millisecond lookup: Get rank of a specific word for a puzzle.
   */
  async getRankForWord(puzzleId: string, wordId: string) {
    const results = await db
      .select({
        puzzleId: puzzleWords.puzzleId,
        wordId: puzzleWords.wordId,
        word: vocabulary.word,
        normalizedWord: vocabulary.normalizedWord,
        semanticScore: puzzleWords.semanticScore,
        rank: puzzleWords.rank,
      })
      .from(puzzleWords)
      .innerJoin(vocabulary, eq(puzzleWords.wordId, vocabulary.id))
      .where(
        and(
          eq(puzzleWords.puzzleId, puzzleId),
          eq(puzzleWords.wordId, wordId)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Get top N ranked words for a puzzle (e.g. for post-game revelation).
   */
  async getTopRanks(puzzleId: string, limit = 100) {
    return db
      .select({
        rank: puzzleWords.rank,
        word: vocabulary.word,
        normalizedWord: vocabulary.normalizedWord,
        semanticScore: puzzleWords.semanticScore,
      })
      .from(puzzleWords)
      .innerJoin(vocabulary, eq(puzzleWords.wordId, vocabulary.id))
      .where(eq(puzzleWords.puzzleId, puzzleId))
      .orderBy(puzzleWords.rank)
      .limit(limit);
  }
}
