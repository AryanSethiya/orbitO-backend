import { pgTable, uuid, varchar, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { users } from './users.js';

export const communityRooms = pgTable('community_rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 16 }).notNull().unique(),
  name: varchar('name', { length: 128 }).notNull(),
  creatorId: uuid('creator_id').references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const communityMembers = pgTable(
  'community_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    roomId: uuid('room_id').references(() => communityRooms.id, { onDelete: 'cascade' }).notNull(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    memberUnq: uniqueIndex('room_user_unq_idx').on(table.roomId, table.userId),
  })
);
