import { pgTable, integer, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listings } from './listings';
import { photos } from './photos';

// Junction table for many-to-many relationship between listings and photos
export const listingPhotos = pgTable('listing_photos', {
  listingId: integer('listing_id')
    .notNull()
    .references(() => listings.id, { onDelete: 'cascade' }),
  photoId: integer('photo_id')
    .notNull()
    .references(() => photos.id, { onDelete: 'cascade' }),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.listingId, table.photoId] }),
  };
});

// Define the relations
export const listingPhotosRelations = relations(listingPhotos, ({ one }) => ({
  listing: one(listings, {
    fields: [listingPhotos.listingId],
    references: [listings.id],
  }),
  photo: one(photos, {
    fields: [listingPhotos.photoId],
    references: [photos.id],
  }),
}));

// Types for TypeScript
export type ListingPhoto = typeof listingPhotos.$inferSelect;
export type NewListingPhoto = typeof listingPhotos.$inferInsert; 