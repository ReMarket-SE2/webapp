import { pgTable, serial, varchar, integer, text, check, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { users } from './users';
import { orders } from './orders';

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 120 }).notNull(),
  score: integer('score').notNull(),
  description: text('description').notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    // Add a check constraint to ensure score is between 1 and 5
    scoreCheck: check('score_check', sql`${table.score} >= 1 AND ${table.score} <= 5`),
    // Add a check constraint for description length <= 1000
    descriptionLengthCheck: check('description_length_check', sql`char_length(${table.description}) <= 1000`),
  };
});

// Define the relations
export const reviewsRelations = relations(reviews, ({ one }) => ({
  user: one(users, {
    fields: [reviews.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [reviews.orderId],
    references: [orders.id],
  }),
}));

// Types for TypeScript
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;