import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  username: text('username').notNull().unique(),
  name: text('name'),
  avatarUrl: text('avatar_url'),
  googleId: text('google_id'),
  community: text('community').default('Global Explorers'),
  passwordHash: text('password_hash').default('oauth_no_password'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
