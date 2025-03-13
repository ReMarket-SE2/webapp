import { db } from '../index';
import { photos, type NewPhoto, type Photo } from '../schema/photos';
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

  // Update a photo
  update: async (id: number, photo: Partial<NewPhoto>): Promise<Photo | undefined> => {
    const result = await db.update(photos).set(photo).where(eq(photos.id, id)).returning();
    return result[0];
  },

  // Delete a photo
  delete: async (id: number): Promise<void> => {
    await db.delete(photos).where(eq(photos.id, id));
  },
}; 