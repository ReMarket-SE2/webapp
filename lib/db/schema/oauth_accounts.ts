import { pgTable, serial, varchar, integer, pgEnum, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';

export const providerTypeEnum = pgEnum('provider_type', ['google']);

export const oauthAccounts = pgTable('oauth_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id),
  provider: providerTypeEnum('provider').notNull(),
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Add a unique constraint to prevent duplicate accounts
export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, {
    fields: [oauthAccounts.userId],
    references: [users.id],
  }),
}));

// Types for TypeScript
export type OAuthAccount = typeof oauthAccounts.$inferSelect;
export type NewOAuthAccount = typeof oauthAccounts.$inferInsert; 