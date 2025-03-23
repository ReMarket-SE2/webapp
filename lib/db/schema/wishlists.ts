import { pgTable, serial, varchar, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { users } from './users';
import { wishlistListings } from './wishlist_listings';

export const wishlists = pgTable('wishlists', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

// Define the relations
export const wishlistsRelations = relations(wishlists, ({ one, many }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  wishlistListings: many(wishlistListings),
}));

// Types for TypeScript
export type Wishlist = typeof wishlists.$inferSelect;
export type NewWishlist = typeof wishlists.$inferInsert; 