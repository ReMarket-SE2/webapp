import { db } from '../index';
import { listingPhotos, type NewListingPhoto } from '../schema/listing_photos';
import { eq, and } from 'drizzle-orm';

export const listingPhotosRepository = {
  // Associate a photo with a listing
  associate: async (listingId: number, photoId: number): Promise<void> => {
    // Check if association already exists
    const exists = await db.select({ count: db.fn.count() })
      .from(listingPhotos)
      .where(and(
        eq(listingPhotos.listingId, listingId),
        eq(listingPhotos.photoId, photoId)
      ));
    
    // Only insert if it doesn't exist
    if (exists[0].count === 0) {
      await db.insert(listingPhotos).values({ listingId, photoId });
    }
  },
  
  // Associate multiple photos with a listing
  associateMany: async (associations: NewListingPhoto[]): Promise<void> => {
    if (!associations.length) return;
    
    await db.transaction(async (tx) => {
      for (const assoc of associations) {
        // Check if association already exists
        const exists = await tx.select({ count: tx.fn.count() })
          .from(listingPhotos)
          .where(and(
            eq(listingPhotos.listingId, assoc.listingId),
            eq(listingPhotos.photoId, assoc.photoId)
          ));
        
        // Only insert if it doesn't exist
        if (exists[0].count === 0) {
          await tx.insert(listingPhotos).values(assoc);
        }
      }
    });
  },
  
  // Remove an association
  dissociate: async (listingId: number, photoId: number): Promise<void> => {
    await db.delete(listingPhotos)
      .where(and(
        eq(listingPhotos.listingId, listingId),
        eq(listingPhotos.photoId, photoId)
      ));
  },
  
  // Get all photos associated with a listing
  getPhotoIdsByListingId: async (listingId: number): Promise<number[]> => {
    const result = await db.select({
      photoId: listingPhotos.photoId
    }).from(listingPhotos).where(eq(listingPhotos.listingId, listingId));
    
    return result.map(r => r.photoId);
  },
  
  // Get all listings associated with a photo
  getListingIdsByPhotoId: async (photoId: number): Promise<number[]> => {
    const result = await db.select({
      listingId: listingPhotos.listingId
    }).from(listingPhotos).where(eq(listingPhotos.photoId, photoId));
    
    return result.map(r => r.listingId);
  }
}; 