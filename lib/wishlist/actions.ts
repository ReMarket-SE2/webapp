"use server"

import { db } from '@/lib/db';
import { wishlistListings } from '@/lib/db/schema/wishlist_listings';
import { wishlists } from '@/lib/db/schema/wishlists';
import { listings } from '@/lib/db/schema/listings';
import { eq, and } from 'drizzle-orm';

async function getWishlistByUserId(userId: number) {
  const wishlist = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.userId, userId))
    .limit(1);

  return wishlist[0];
}

export async function getWishlistListingsByUserId(userId: number) {
  const wishlist = await getWishlistByUserId(userId);

  return db
    .select({ id: wishlistListings.listingId, title: listings.title })
    .from(wishlistListings)
    .innerJoin(listings, eq(wishlistListings.listingId, listings.id))
    .where(eq(wishlistListings.wishlistId, wishlist.id));
}

export async function addListingToWishlist(userId: number, listingId: number) {
  const wishlist = await getWishlistByUserId(userId);

  return db.insert(wishlistListings).values({
    wishlistId: wishlist.id,
    listingId,
  });
}

export async function removeListingFromWishlist(userId: number, listingId: number) {
  const wishlist = await getWishlistByUserId(userId);

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
  const wishlist = await getWishlistByUserId(userId);

  return db
    .delete(wishlistListings)
    .where(eq(wishlistListings.wishlistId, wishlist.id));
}

export async function createWishlist(userId: number) {
  return db.insert(wishlists).values({ userId });
}

export async function deleteWishlist(userId: number) {
  return db.delete(wishlists).where(eq(wishlists.userId, userId));
}