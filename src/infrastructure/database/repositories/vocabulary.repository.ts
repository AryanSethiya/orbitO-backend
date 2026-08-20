import { eq, and, sql } from 'drizzle-orm';
import { db } from '../index.js';
import { vocabulary } from '../schema/vocabulary.js';

export interface InsertVocabularyItem {
  word: string;
  normalizedWord: string;
  embedding: number[];
  vocabularyVersion?: string;
  isActive?: boolean;
}

export class VocabularyRepository {
  /**
   * Find a vocabulary word by normalized string.
   */
  async findByNormalizedWord(normalizedWord: string, version = 'v1') {
    const results = await db
      .select()
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.normalizedWord, normalizedWord),
          eq(vocabulary.vocabularyVersion, version),
          eq(vocabulary.isActive, true)
        )
      )
      .limit(1);

    return results[0] || null;
  }

  /**
   * Find a vocabulary word by ID.
   */
  async findById(id: string) {
    const results = await db
      .select()
      .from(vocabulary)
      .where(eq(vocabulary.id, id))
      .limit(1);

    return results[0] || null;
  }

  /**
   * Batch insert or ignore on collision.
   */
  async batchUpsert(items: InsertVocabularyItem[], chunkSize = 200) {
    if (items.length === 0) return;

    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await db
        .insert(vocabulary)
        .values(
          chunk.map((item) => ({
            word: item.word,
            normalizedWord: item.normalizedWord,
            embedding: item.embedding,
            vocabularyVersion: item.vocabularyVersion || 'v1',
            isActive: item.isActive !== undefined ? item.isActive : true,
          }))
        )
        .onConflictDoNothing({ target: vocabulary.normalizedWord });
    }
  }

  /**
   * Retrieve all active words and their embeddings for a given version.
   */
  async getAllWithEmbeddings(version = 'v1') {
    return db
      .select({
        id: vocabulary.id,
        word: vocabulary.word,
        normalizedWord: vocabulary.normalizedWord,
        embedding: vocabulary.embedding,
      })
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.vocabularyVersion, version),
          eq(vocabulary.isActive, true)
        )
      );
  }

  /**
   * Get count of vocabulary items.
   */
  async count(version = 'v1'): Promise<number> {
    const res = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.vocabularyVersion, version),
          eq(vocabulary.isActive, true)
        )
      );

    return res[0]?.count ?? 0;
  }

  /**
   * Select a random eligible target word.
   */
  async getRandomTarget(version = 'v1') {
    const results = await db
      .select()
      .from(vocabulary)
      .where(
        and(
          eq(vocabulary.vocabularyVersion, version),
          eq(vocabulary.isActive, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(1);

    return results[0] || null;
  }
}
