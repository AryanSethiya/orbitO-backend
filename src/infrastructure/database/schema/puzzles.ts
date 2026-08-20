import { pgTable, uuid, date, text, timestamp, index } from 'drizzle-orm/pg-core';
import { vocabulary } from './vocabulary.js';

export const dailyPuzzles = pgTable(
  'daily_puzzles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    date: date('date').notNull().unique(), // Format: YYYY-MM-DD
    targetWordId: uuid('target_word_id')
      .notNull()
      .references(() => vocabulary.id),
    vocabularyVersion: text('vocabulary_version').notNull().default('v1'),
    hint1: text('hint_1').notNull(),
    hint2: text('hint_2').notNull(),
    hint3: text('hint_3').notNull(),
    difficulty: text('difficulty').notNull().default('medium'),
    status: text('status').notNull().default('published'), // 'draft' | 'published' | 'archived'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('puzzles_date_idx').on(table.date),
  ]
);
