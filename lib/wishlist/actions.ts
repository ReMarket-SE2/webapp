"use server"

import { db } from '@/lib/db';
import { wishlistListings } from '@/lib/db/schema/wishlist_listings';
import { wishlists } from '@/lib/db/schema/wishlists';
import { listings } from '@/lib/db/schema/listings';
import { users } from '@/lib/db/schema/users';
import { eq, and } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

  if (wishlist.length === 0) {
    return null;
  } else {
    return wishlist[0] as Wishlist;
  }
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
    .innerJoin(users, eq(listings.sellerId, users.id))
    .where(
      and(
        eq(wishlistListings.wishlistId, wishlist.id),
        eq(users.status, 'active')
      )
    );
}

export async function addListingToWishlist(userId: number, listingId: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.status === 'suspended') {
    throw new Error('Account suspended. You cannot modify your wishlist while suspended.');
  }

  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db.insert(wishlistListings).values({
    wishlistId: wishlist.id,
    listingId,
  });
}

export async function removeListingFromWishlist(userId: number, listingId: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.status === 'suspended') {
    throw new Error('Account suspended. You cannot modify your wishlist while suspended.');
  }

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
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.status === 'suspended') {
    throw new Error('Account suspended. You cannot modify your wishlist while suspended.');
  }

  const wishlist = await getOrCreateWishlistByUserId(userId);

  return db
    .delete(wishlistListings)
    .where(eq(wishlistListings.wishlistId, wishlist.id));
}

export async function createWishlist(userId: number): Promise<Wishlist> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.status === 'suspended') {
    throw new Error('Account suspended. You cannot create a wishlist while suspended.');
  }

  const [createdWishlist] = await db.insert(wishlists).values({ userId }).returning();
  return createdWishlist as Wishlist;
}

export async function deleteWishlist(userId: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if (session.user.status === 'suspended') {
    throw new Error('Account suspended. You cannot delete your wishlist while suspended.');
  }

  return db.delete(wishlists).where(eq(wishlists.userId, userId));
}