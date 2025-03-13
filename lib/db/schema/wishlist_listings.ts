import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { wishlists } from './wishlists';
import { listings } from './listings';

// Junction table for many-to-many relationship between wishlists and listings
export const wishlistListings = pgTable('wishlist_listings', {
  wishlistId: integer('wishlist_id')
    .notNull()
    .references(() => wishlists.id, { onDelete: 'cascade' }),
  listingId: integer('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.wishlistId, table.listingId] }),
  };
});

// Define the relations
export const wishlistListingsRelations = relations(wishlistListings, ({ one }) => ({
  wishlist: one(wishlists, {
    fields: [wishlistListings.wishlistId],
    references: [wishlists.id],
  }),
  listing: one(listings, {
    fields: [wishlistListings.listingId],
    references: [listings.id],
  }),
}));

// Types for TypeScript
export type WishlistListing = typeof wishlistListings.$inferSelect;
export type NewWishlistListing = typeof wishlistListings.$inferInsert; 