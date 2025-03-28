import { pgTable, serial, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { listingPhotos } from './listing_photos';
import { users } from './users';

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  image: text('image').notNull(), // For base64 encoded images
});

// Define the relations
export const photosRelations = relations(photos, ({ many }) => ({
  listingPhotos: many(listingPhotos),
  userProfileImages: many(users, { relationName: 'profileImage' }),
}));

// Types for TypeScript
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert; 