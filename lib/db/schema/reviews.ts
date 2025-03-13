import { pgTable, serial, varchar, integer, text, check } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { listings } from './listings';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  score: integer('score').notNull(),
  description: text('description'),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id').notNull().references(() => listings.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    // Add a check constraint to ensure score is between 1 and 5
    scoreCheck: check('score_check', sql`${table.score} >= 1 AND ${table.score} <= 5`),
  };
});

// Define the relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  listing: one(listings, {
    fields: [reviews.listingId],
    references: [listings.id],
  }),
}));

// Types for TypeScript
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert; 