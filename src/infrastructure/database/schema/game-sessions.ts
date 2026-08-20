import { pgTable, uuid, integer, boolean, timestamp, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { users } from './users.js';
import { dailyPuzzles } from './puzzles.js';

export const gameSessions = pgTable(
  'game_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    puzzleId: uuid('puzzle_id')
      .notNull()
      .references(() => dailyPuzzles.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    score: integer('score').notNull().default(0),
    guessesCount: integer('guesses_count').notNull().default(0),
    hintsUsed: integer('hints_used').notNull().default(0),
    solved: boolean('solved').notNull().default(false),
  },
  (table) => [
    uniqueIndex('user_puzzle_session_idx').on(table.userId, table.puzzleId),
    index('session_puzzle_idx').on(table.puzzleId),
  ]
);
