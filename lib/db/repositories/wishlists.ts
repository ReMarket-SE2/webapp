import { db } from '../index';
import { wishlists, type NewWishlist, type Wishlist } from '../schema/wishlists';
import { wishlistListings } from '../schema/wishlist_listings';
import { listings, type Listing } from '../schema/listings';
import { eq, and } from 'drizzle-orm';

export const wishlistsRepository = {
  // Get all wishlists
  getAll: async (): Promise<Wishlist[]> => {
    return db.select().from(wishlists);
  },

  // Get wishlist by ID
  getById: async (id: number): Promise<Wishlist | undefined> => {
    const result = await db.select().from(wishlists).where(eq(wishlists.id, id));
    return result[0];
  },

  // Get wishlists by user ID
  getByUserId: async (userId: number): Promise<Wishlist[]> => {
    return db.select().from(wishlists).where(eq(wishlists.userId, userId));
  },

  // Create a new wishlist
  create: async (wishlist: NewWishlist): Promise<Wishlist> => {
    const result = await db.insert(wishlists).values(wishlist).returning();
    return result[0];
  },

  // Update a wishlist
  update: async (id: number, wishlist: Partial<NewWishlist>): Promise<Wishlist | undefined> => {
    const result = await db.update(wishlists).set(wishlist).where(eq(wishlists.id, id)).returning();
    return result[0];
  },

  // Delete a wishlist
  delete: async (id: number): Promise<void> => {
    await db.delete(wishlists).where(eq(wishlists.id, id));
  },

  // Get wishlist with its listings
  getWithListings: async (id: number): Promise<{ wishlist: Wishlist, listings: Listing[] } | undefined> => {
    const wishlist = await wishlistsRepository.getById(id);
    if (!wishlist) return undefined;

    // Get the listing IDs associated with this wishlist
    const listingRelations = await db.select({
      listingId: wishlistListings.listingId
    }).from(wishlistListings).where(eq(wishlistListings.wishlistId, id));
    
    // If there are no listings, return just the wishlist
    if (listingRelations.length === 0) {
      return { wishlist, listings: [] };
    }
    
    // Get the actual listings
    const listingIds = listingRelations.map(rel => rel.listingId);
    const wishlistListingsData = await db.select().from(listings).where(
      listingIds.length === 1 
        ? eq(listings.id, listingIds[0]) 
        : listings.id.in(listingIds)
    );
    
    return {
      wishlist,
      listings: wishlistListingsData,
    };
  },

  // Add a listing to a wishlist
  addListing: async (wishlistId: number, listingId: number): Promise<void> => {
    // Check if the association already exists
    const exists = await db.select({ count: db.fn.count() })
      .from(wishlistListings)
      .where(and(
        eq(wishlistListings.wishlistId, wishlistId),
        eq(wishlistListings.listingId, listingId)
      ));
    
    // Only insert if it doesn't exist
    if (exists[0].count === 0) {
      await db.insert(wishlistListings).values({
        wishlistId,
        listingId
      });
    }
  },

  // Remove a listing from a wishlist
  removeListing: async (wishlistId: number, listingId: number): Promise<void> => {
    await db.delete(wishlistListings)
      .where(and(
        eq(wishlistListings.wishlistId, wishlistId),
        eq(wishlistListings.listingId, listingId)
      ));
  },

  // Check if a listing is in a wishlist
  hasListing: async (wishlistId: number, listingId: number): Promise<boolean> => {
    const result = await db.select({ count: db.fn.count() })
      .from(wishlistListings)
      .where(and(
        eq(wishlistListings.wishlistId, wishlistId),
        eq(wishlistListings.listingId, listingId)
      ));
    
    return result[0].count > 0;
  },

  // Get all listings in a wishlist
  getListings: async (wishlistId: number): Promise<Listing[]> => {
    const listingRelations = await db.select({
      listingId: wishlistListings.listingId
    }).from(wishlistListings).where(eq(wishlistListings.wishlistId, wishlistId));
    
    if (listingRelations.length === 0) return [];
    
    const listingIds = listingRelations.map(rel => rel.listingId);
    return db.select().from(listings).where(
      listingIds.length === 1 
        ? eq(listings.id, listingIds[0]) 
        : listings.id.in(listingIds)
    );
  },

  // Create a wishlist with listings
  createWithListings: async (wishlistData: NewWishlist, listingIds: number[]): Promise<{ wishlist: Wishlist, listings: Listing[] }> => {
    return await db.transaction(async (tx) => {
      // Create the wishlist first
      const [newWishlist] = await tx.insert(wishlists).values(wishlistData).returning();
      
      // Add listings if provided
      if (listingIds && listingIds.length > 0) {
        const wishlistListingsData = listingIds.map(listingId => ({
          wishlistId: newWishlist.id,
          listingId
        }));
        
        await tx.insert(wishlistListings).values(wishlistListingsData);
      }
      
      // Get the listings
      const wishlistListingsResult = await wishlistsRepository.getListings(newWishlist.id);
      
      return {
        wishlist: newWishlist,
        listings: wishlistListingsResult
      };
    });
  }
}; 