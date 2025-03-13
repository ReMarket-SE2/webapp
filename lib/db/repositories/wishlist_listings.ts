import { db } from '../index';
import { wishlistListings, type NewWishlistListing } from '../schema/wishlist_listings';
import { eq, and } from 'drizzle-orm';

export const wishlistListingsRepository = {
  // Associate a listing with a wishlist
  associate: async (wishlistId: number, listingId: number): Promise<void> => {
    // Check if association already exists
    const exists = await db.select({ count: db.fn.count() })
      .from(wishlistListings)
      .where(and(
        eq(wishlistListings.wishlistId, wishlistId),
        eq(wishlistListings.listingId, listingId)
      ));
    
    // Only insert if it doesn't exist
    if (exists[0].count === 0) {
      await db.insert(wishlistListings).values({ wishlistId, listingId });
    }
  },
  
  // Associate multiple listings with a wishlist
  associateMany: async (associations: NewWishlistListing[]): Promise<void> => {
    if (!associations.length) return;
    
    await db.transaction(async (tx) => {
      for (const assoc of associations) {
        // Check if association already exists
        const exists = await tx.select({ count: tx.fn.count() })
          .from(wishlistListings)
          .where(and(
            eq(wishlistListings.wishlistId, assoc.wishlistId),
            eq(wishlistListings.listingId, assoc.listingId)
          ));
        
        // Only insert if it doesn't exist
        if (exists[0].count === 0) {
          await tx.insert(wishlistListings).values(assoc);
        }
      }
    });
  },
  
  // Remove an association
  dissociate: async (wishlistId: number, listingId: number): Promise<void> => {
    await db.delete(wishlistListings)
      .where(and(
        eq(wishlistListings.wishlistId, wishlistId),
        eq(wishlistListings.listingId, listingId)
      ));
  },
  
  // Get all listings associated with a wishlist
  getListingIdsByWishlistId: async (wishlistId: number): Promise<number[]> => {
    const result = await db.select({
      listingId: wishlistListings.listingId
    }).from(wishlistListings).where(eq(wishlistListings.wishlistId, wishlistId));
    
    return result.map(r => r.listingId);
  },
  
  // Get all wishlists associated with a listing
  getWishlistIdsByListingId: async (listingId: number): Promise<number[]> => {
    const result = await db.select({
      wishlistId: wishlistListings.wishlistId
    }).from(wishlistListings).where(eq(wishlistListings.listingId, listingId));
    
    return result.map(r => r.wishlistId);
  }
}; 