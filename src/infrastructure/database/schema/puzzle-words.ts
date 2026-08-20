import { pgTable, uuid, doublePrecision, integer, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { dailyPuzzles } from './puzzles.js';
import { vocabulary } from './vocabulary.js';

export const puzzleWords = pgTable(
  'puzzle_words',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    puzzleId: uuid('puzzle_id')
      .notNull()
      .references(() => dailyPuzzles.id, { onDelete: 'cascade' }),
    wordId: uuid('word_id')
      .notNull()
      .references(() => vocabulary.id, { onDelete: 'cascade' }),
    semanticScore: doublePrecision('semantic_score').notNull(),
    rank: integer('rank').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('puzzle_word_unique_idx').on(table.puzzleId, table.wordId),
    index('puzzle_rank_idx').on(table.puzzleId, table.rank),
  ]
);
