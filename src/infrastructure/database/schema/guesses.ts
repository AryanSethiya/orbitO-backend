import { pgTable, uuid, doublePrecision, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { gameSessions } from './game-sessions.js';
import { vocabulary } from './vocabulary.js';

export const guesses = pgTable(
  'guesses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id')
      .notNull()
      .references(() => vocabulary.id),
    semanticScore: doublePrecision('semantic_score').notNull(),
    rank: integer('rank').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('guess_session_idx').on(table.gameSessionId),
    index('guess_session_rank_idx').on(table.gameSessionId, table.rank),
  ]
);
