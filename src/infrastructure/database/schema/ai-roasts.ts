import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { gameSessions } from './game-sessions.js';

export const aiRoasts = pgTable(
  'ai_roasts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    gameSessionId: uuid('game_session_id')
      .notNull()
      .references(() => gameSessions.id, { onDelete: 'cascade' }),
    roastText: text('roast_text').notNull(),
    roastStyle: text('roast_style').notNull().default('balanced'), // 'friendly' | 'savage' | 'hype' | 'balanced'
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('roast_session_idx').on(table.gameSessionId),
  ]
);
