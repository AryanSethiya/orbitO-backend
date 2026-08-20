import { pgTable, uuid, text, boolean, timestamp, vector, index } from 'drizzle-orm/pg-core';

export const vocabulary = pgTable(
  'vocabulary',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    word: text('word').notNull(),
    normalizedWord: text('normalized_word').notNull().unique(),
    embedding: vector('embedding', { dimensions: 768 }),
    vocabularyVersion: text('vocabulary_version').notNull().default('v1'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('vocab_normalized_idx').on(table.normalizedWord),
    index('vocab_version_idx').on(table.vocabularyVersion),
  ]
);
