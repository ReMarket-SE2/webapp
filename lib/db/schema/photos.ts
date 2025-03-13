import { pgTable, serial, text } from 'drizzle-orm/pg-core';

export const photos = pgTable('photos', {
  id: serial('id').primaryKey(),
  image: text('image').notNull(), // For base64 encoded images
});

// Types for TypeScript
export type Photo = typeof photos.$inferSelect;
export type NewPhoto = typeof photos.$inferInsert; 