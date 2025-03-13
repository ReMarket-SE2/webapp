import { db } from '../index';
import { photos, type NewPhoto, type Photo } from '../schema/photos';
import { listingPhotos } from '../schema/listing_photos';
import { eq } from 'drizzle-orm';

export const photosRepository = {
  // Get all photos
  getAll: async (): Promise<Photo[]> => {
    return db.select().from(photos);
  },

  // Get photo by ID
  getById: async (id: number): Promise<Photo | undefined> => {
    const result = await db.select().from(photos).where(eq(photos.id, id));
    return result[0];
  },

  // Create a new photo
  create: async (photo: NewPhoto): Promise<Photo> => {
    const result = await db.insert(photos).values(photo).returning();
    return result[0];
  },

  // Create multiple photos
  createMany: async (photoData: NewPhoto[]): Promise<Photo[]> => {
    if (!photoData.length) return [];
    return db.insert(photos).values(photoData).returning();
  },

  // Update a photo
  update: async (id: number, photo: Partial<NewPhoto>): Promise<Photo | undefined> => {
    const result = await db.update(photos).set(photo).where(eq(photos.id, id)).returning();
    return result[0];
  },

  // Delete a photo
  delete: async (id: number): Promise<void> => {
    await db.delete(photos).where(eq(photos.id, id));
  },

  // Get photos for a specific listing
  getByListingId: async (listingId: number): Promise<Photo[]> => {
    const photoRelations = await db.select({
      photoId: listingPhotos.photoId
    }).from(listingPhotos).where(eq(listingPhotos.listingId, listingId));
    
    if (photoRelations.length === 0) return [];
    
    const photoIds = photoRelations.map(rel => rel.photoId);
    return db.select().from(photos).where(
      photoIds.length === 1 
        ? eq(photos.id, photoIds[0]) 
        : photos.id.in(photoIds)
    );
  },

  // Add a photo to a listing
  addToListing: async (listingId: number, imageData: string): Promise<Photo> => {
    const result = await db.insert(photos).values({
      image: imageData,
      listingId,
    }).returning();
    return result[0];
  },

  // Remove all photos for a listing
  removeAllForListing: async (listingId: number): Promise<void> => {
    await db.delete(photos).where(eq(photos.listingId, listingId));
  },
}; 