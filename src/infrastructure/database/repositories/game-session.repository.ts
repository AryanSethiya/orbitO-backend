import { eq, and, sql } from 'drizzle-orm';
import { db } from '../index.js';
import { gameSessions } from '../schema/game-sessions.js';
import { guesses } from '../schema/guesses.js';
import { users } from '../schema/users.js';
import { vocabulary } from '../schema/vocabulary.js';
import { getProximitySignal } from '../../../core/services/proximity-classifier.js';

export interface CreateSessionInput {
  userId: string;
  puzzleId: string;
}

export class GameSessionRepository {
  /**
   * Create a new game session or return existing.
   */
  async getOrCreateSession(input: CreateSessionInput) {
    // 1. Ensure user exists with unique username & email
    const safeUserSlice = input.userId.replace(/-/g, '').substring(0, 10);
    await db
      .insert(users)
      .values({
        id: input.userId,
        email: `pilot_${safeUserSlice}@orbito.local`,
        username: `Pilot_${safeUserSlice}`,
        passwordHash: 'guest_no_login_required',
      })
      .onConflictDoNothing();

    const existing = await this.findByUserAndPuzzle(input.userId, input.puzzleId);
    if (existing) {
      return existing;
    }

    const inserted = await db
      .insert(gameSessions)
      .values({
        userId: input.userId,
        puzzleId: input.puzzleId,
        score: 0,
        guessesCount: 0,
        hintsUsed: 0,
        solved: false,
      })
      .returning();

    return inserted[0];
  }

  /**
   * Find session by user and puzzle ID.
   */
  async findByUserAndPuzzle(userId: string, puzzleId: string) {
    const results = await db
      .select()
      .from(gameSessions)
      .where(
        and(
          eq(gameSessions.userId, userId),
          eq(gameSessions.puzzleId, puzzleId)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find session by ID.
   */
  async findById(sessionId: string) {
    const results = await db
      .select()
      .from(gameSessions)
      .where(eq(gameSessions.id, sessionId))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Record a guess in the database and increment session guess count.
   */
  async recordGuess(sessionId: string, wordId: string, semanticScore: number, rank: number) {
    // 1. Insert guess record
    const insertedGuess = await db
      .insert(guesses)
      .values({
        gameSessionId: sessionId,
        wordId,
        semanticScore,
        rank,
      })
      .returning();

    // 2. Increment guess counter on session
    await db
      .update(gameSessions)
      .set({
        guessesCount: sql`${gameSessions.guessesCount} + 1`,
      })
      .where(eq(gameSessions.id, sessionId));

    return insertedGuess[0];
  }

  /**
   * Increment hint count on session.
   */
  async incrementHints(sessionId: string) {
    const updated = await db
      .update(gameSessions)
      .set({
        hintsUsed: sql`${gameSessions.hintsUsed} + 1`,
      })
      .where(eq(gameSessions.id, sessionId))
      .returning();

    return updated[0];
  }

  /**
   * Complete session and lock final score.
   */
  async completeSession(sessionId: string, finalScore: number) {
    const updated = await db
      .update(gameSessions)
      .set({
        solved: true,
        score: finalScore,
        completedAt: new Date(),
      })
      .where(eq(gameSessions.id, sessionId))
      .returning();

    return updated[0];
  }

  /**
   * Get chronological guess history for a session.
   */
  async getSessionGuesses(sessionId: string) {
    const results = await db
      .select({
        id: guesses.id,
        wordId: guesses.wordId,
        word: vocabulary.word,
        normalizedWord: vocabulary.normalizedWord,
        semanticScore: guesses.semanticScore,
        rank: guesses.rank,
        createdAt: guesses.createdAt,
      })
      .from(guesses)
      .innerJoin(vocabulary, eq(guesses.wordId, vocabulary.id))
      .where(eq(guesses.gameSessionId, sessionId))
      .orderBy(guesses.createdAt);

    return results.map((g) => ({
      ...g,
      signal: getProximitySignal(g.rank),
    }));
  }
}
