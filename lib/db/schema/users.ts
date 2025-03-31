import { pgTable, serial, varchar, timestamp, text, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { photos } from './photos';
import { wishlists } from './wishlists';
import { reviews } from './reviews';
import { orders } from './orders';

// Create an enum for user roles
export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  profileImageId: integer('profile_image_id').references(() => photos.id),
  role: userRoleEnum('role').notNull().default('user'),
  password_reset_token: text('password_reset_token'),
  password_reset_expires: timestamp('password_reset_expires'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define the relations
export const usersRelations = relations(users, ({ one, many }) => ({
  profileImage: one(photos, {
    fields: [users.profileImageId],
    references: [photos.id],
  }),
  wishlists: many(wishlists),
  reviews: many(reviews),
  orders: many(orders),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = 'user' | 'admin'; 