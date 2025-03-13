import { db } from '../index';
import { listings, type NewListing, type Listing } from '../schema/listings';
import { photos, type Photo } from '../schema/photos';
import { listingPhotos } from '../schema/listing_photos';
import { eq, and } from 'drizzle-orm';

export const listingsRepository = {
  // Get all listings
  getAll: async (): Promise<Listing[]> => {
    return db.select().from(listings);
  },

  // Get listing by ID
  getById: async (id: number): Promise<Listing | undefined> => {
    const result = await db.select().from(listings).where(eq(listings.id, id));
    return result[0];
  },

  // Create a new listing
  create: async (listing: NewListing): Promise<Listing> => {
    const result = await db.insert(listings).values(listing).returning();
    return result[0];
  },

  // Update a listing
  update: async (id: number, listing: Partial<NewListing>): Promise<Listing | undefined> => {
    const result = await db.update(listings).set(listing).where(eq(listings.id, id)).returning();
    return result[0];
  },

  // Delete a listing
  delete: async (id: number): Promise<void> => {
    await db.delete(listings).where(eq(listings.id, id));
  },

  // Get listing with its photos
  getWithPhotos: async (id: number): Promise<{ listing: Listing, photos: Photo[] } | undefined> => {
    const listing = await listingsRepository.getById(id);
    if (!listing) return undefined;

    // Get the photo IDs associated with this listing
    const photoRelations = await db.select({
      photoId: listingPhotos.photoId
    }).from(listingPhotos).where(eq(listingPhotos.listingId, id));
    
    // If there are no photos, return just the listing
    if (photoRelations.length === 0) {
      return { listing, photos: [] };
    }
    
    // Get the actual photos
    const photoIds = photoRelations.map(rel => rel.photoId);
    const listingPhotosData = await db.select().from(photos).where(
      photoIds.length === 1 
        ? eq(photos.id, photoIds[0]) 
        : photos.id.in(photoIds)
    );
    
    return {
      listing,
      photos: listingPhotosData,
    };
  },

  // Get all listings with their photos
  getAllWithPhotos: async (): Promise<{ listing: Listing, photos: Photo[] }[]> => {
    const allListings = await listingsRepository.getAll();
    const result = [];

    for (const listing of allListings) {
      const { photos } = await listingsRepository.getWithPhotos(listing.id) || { photos: [] };
      result.push({
        listing,
        photos,
      });
    }

    return result;
  },
  
  // Create a listing with photos in a single operation
  createWithPhotos: async (
    listingData: NewListing, 
    photoImages: string[]
  ): Promise<{ listing: Listing, photos: Photo[] }> => {
    // Use a transaction to ensure all operations succeed or fail together
    return await db.transaction(async (tx) => {
      // Create the listing first
      const [newListing] = await tx.insert(listings).values(listingData).returning();
      
      // If there are photos to add
      let listingPhotosData = [];
      if (photoImages && photoImages.length > 0) {
        // Create the photos first
        const photoEntries = photoImages.map(image => ({ image }));
        const newPhotos = await tx.insert(photos).values(photoEntries).returning();
        
        // Create the associations in the junction table
        const photoAssociations = newPhotos.map(photo => ({
          listingId: newListing.id,
          photoId: photo.id
        }));
        
        await tx.insert(listingPhotos).values(photoAssociations);
        listingPhotosData = newPhotos;
      }
      
      return {
        listing: newListing,
        photos: listingPhotosData
      };
    });
  },
  
  // Update a listing with photos (replaces existing photos)
  updateWithPhotos: async (
    id: number, 
    listingData: Partial<NewListing>, 
    photoImages: string[]
  ): Promise<{ listing: Listing, photos: Photo[] } | undefined> => {
    return await db.transaction(async (tx) => {
      // Update the listing
      const [updatedListing] = await tx.update(listings)
        .set(listingData)
        .where(eq(listings.id, id))
        .returning();
      
      if (!updatedListing) return undefined;
      
      // Get existing photo associations
      const existingAssociations = await tx.select({
        photoId: listingPhotos.photoId
      }).from(listingPhotos).where(eq(listingPhotos.listingId, id));
      
      // Delete existing associations
      if (existingAssociations.length > 0) {
        await tx.delete(listingPhotos).where(eq(listingPhotos.listingId, id));
      }
      
      // Add new photos if provided
      let newPhotos = [];
      if (photoImages && photoImages.length > 0) {
        // Create the photos
        const photoEntries = photoImages.map(image => ({ image }));
        newPhotos = await tx.insert(photos).values(photoEntries).returning();
        
        // Create the associations
        const photoAssociations = newPhotos.map(photo => ({
          listingId: id,
          photoId: photo.id
        }));
        
        await tx.insert(listingPhotos).values(photoAssociations);
      }
      
      return {
        listing: updatedListing,
        photos: newPhotos
      };
    });
  },
  
  // Add existing photos to a listing
  addExistingPhotos: async (listingId: number, photoIds: number[]): Promise<void> => {
    if (!photoIds.length) return;
    
    // Create associations for existing photos
    const associations = photoIds.map(photoId => ({
      listingId,
      photoId
    }));
    
    // Insert associations, ignoring duplicates
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
  
  // Remove photos from a listing (without deleting the photos)
  removePhotos: async (listingId: number, photoIds: number[]): Promise<void> => {
    if (!photoIds.length) return;
    
    await db.delete(listingPhotos)
      .where(and(
        eq(listingPhotos.listingId, listingId),
        photoIds.length === 1 
          ? eq(listingPhotos.photoId, photoIds[0]) 
          : listingPhotos.photoId.in(photoIds)
      ));
  }
}; 