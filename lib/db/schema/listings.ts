import { pgTable, serial, varchar, decimal, text, pgEnum, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { categories } from './categories';
import { listingPhotos } from './listing_photos';
import { wishlistListings } from './wishlist_listings';
import { reviews } from './reviews';
import { orders } from './orders';

// Create an enum for listing status
export const listingStatusEnum = pgEnum('listing_status', ['Active', 'Archived', 'Draft']);

export const listings = pgTable('listings', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  status: listingStatusEnum('status').notNull().default('Draft'),
  description: varchar('description', { length: 500 }),
  longDescription: text('long_description'),
  categoryId: integer('category_id').references(() => categories.id),
});

// Define the relations
export const listingsRelations = relations(listings, ({ one, many }) => ({
  category: one(categories, {
    fields: [listings.categoryId],
    references: [categories.id],
  }),
  listingPhotos: many(listingPhotos),
  wishlistListings: many(wishlistListings),
  reviews: many(reviews),
  orders: many(orders),
}));

// Types for TypeScript
export type Listing = typeof listings.$inferSelect;
export type NewListing = typeof listings.$inferInsert;
export type ListingStatus = 'Active' | 'Archived' | 'Draft'; 