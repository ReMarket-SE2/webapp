import { pgTable, serial, varchar, timestamp, text, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { photos } from './photos';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  profileImageId: integer('profile_image_id').references(() => photos.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Define the relation to the profile image
export const usersRelations = relations(users, ({ one }) => ({
  profileImage: one(photos, {
    fields: [users.profileImageId],
    references: [photos.id],
  }),
}));

// Types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert; 