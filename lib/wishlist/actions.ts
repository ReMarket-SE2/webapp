"use server"

import { db } from '@/lib/db';
import { wishlistListings } from '@/lib/db/schema/wishlist_listings';
import { wishlists } from '@/lib/db/schema/wishlists';
import { listings } from '@/lib/db/schema/listings';
import { eq, and } from 'drizzle-orm';

interface Wishlist {
  id: number;
  userId: number;
}

async function getWishlistByUserId(userId: number): Promise<Wishlist | null> {
  const wishlist = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);

  return wishlist[0] as Wishlist || null;
}

async function getOrCreateWishlistByUserId(userId: number): Promise<Wishlist> {
  const wishlist = await getWishlistByUserId(userId);

  if (!wishlist) {
    const createdWishlist = await createWishlist(userId);
    return createdWishlist as Wishlist;
  }

  return wishlist;
}

export async function getWishlistListingsByUserId(userId: number) {
  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db
    .select({ id: wishlistListings.listingId, title: listings.title })
    .from(wishlistListings)
    .innerJoin(listings, eq(wishlistListings.listingId, listings.id))
    .where(eq(wishlistListings.wishlistId, wishlist.id));
}

export async function addListingToWishlist(userId: number, listingId: number) {
  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db.insert(wishlistListings).values({
    wishlistId: wishlist.id,
    listingId,
  });
}

export async function removeListingFromWishlist(userId: number, listingId: number) {
  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db
    .delete(wishlistListings)
    .where(
      and(
        eq(wishlistListings.wishlistId, wishlist.id),
        eq(wishlistListings.listingId, listingId)
      )
    );
}

export async function clearWishlist(userId: number) {
  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db
    .delete(wishlistListings)
    .where(eq(wishlistListings.wishlistId, wishlist.id));
}

export async function createWishlist(userId: number): Promise<Wishlist> {
  const [createdWishlist] = await db.insert(wishlists).values({ userId }).returning();
  return createdWishlist as Wishlist;
}

export async function deleteWishlist(userId: number) {
  return db.delete(wishlists).where(eq(wishlists.userId, userId));
}