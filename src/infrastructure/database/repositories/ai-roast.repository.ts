import { eq } from 'drizzle-orm';
import { db } from '../index.js';
import { aiRoasts } from '../schema/ai-roasts.js';

export interface CreateRoastInput {
  gameSessionId: string;
  roastText: string;
  roastStyle?: string;
}

export class AIRoastRepository {
  /**
   * Save an AI roast for a game session.
   */
  async saveRoast(input: CreateRoastInput) {
    const results = await db
      .insert(aiRoasts)
      .values({
        gameSessionId: input.gameSessionId,
        roastText: input.roastText,
        roastStyle: input.roastStyle || 'balanced',
      })
      .returning();

    return results[0];
  }

  /**
   * Find existing roast for a session.
   */
  async findBySessionId(sessionId: string) {
    const results = await db
      .select()
      .from(aiRoasts)
      .where(eq(aiRoasts.gameSessionId, sessionId))
      .limit(1);

    return results[0] || null;
  }
}
