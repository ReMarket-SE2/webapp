"use server"

import { db } from '@/lib/db'
import { users, photos, listings, listingPhotos, categories } from '@/lib/db/schema'
import { eq, and, gt, isNotNull, asc, desc, inArray } from 'drizzle-orm'
import { User } from '@/lib/db/schema'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { insertPhoto } from '@/lib/photos/actions'
import { createWishlist } from '@/lib/wishlist/actions'
import { count } from 'drizzle-orm'
import { ShortListing } from '@/lib/listings/actions'

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1)
  return result[0] || null
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const result = await db.select().from(users).where(eq(users.username, username)).limit(1)
  return result[0] || null
}

export async function createUser(data: Omit<User, 'id'>): Promise<User> {
  const result = await db.insert(users).values({ ...data }).returning()
  await createWishlist(result[0].id) // Create a wishlist for the new user
  return result[0]
}

export async function userExists(id: number): Promise<boolean> {
  const result = await db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1)
  return result.length > 0
}

export interface UserWithListingCounts extends User {
  activeListingsCount: number;
  archivedListingsCount: number;
  soldListingsCount: number;
  activeListings: ShortListing[];
  totalListings: number;
  categories: { id: number; name: string }[];
}

export interface UserListingsOptions {
  page?: number;
  pageSize?: number;
  sortOrder?: 'asc' | 'desc';
  categoryId?: number | null;
}

export async function findUserById(
  id: number,
  options: UserListingsOptions = {}
): Promise<UserWithListingCounts | null> {
  const {
    page = 1,
    pageSize = 10,
    sortOrder = 'desc',
    categoryId = null,
  } = options;

  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  
  if (!user) {
    return null;
  }

  // Get count of active listings
  const [activeCount] = await db
    .select({ count: count() })
    .from(listings)
    .where(eq(listings.status, 'Active'));

  // Get count of archived listings
  const [archivedCount] = await db
    .select({ count: count() })
    .from(listings)
    .where(eq(listings.status, 'Archived'));

  // Get count of sold listings
  const [soldCount] = await db
    .select({ count: count() })
    .from(listings)
    .where(eq(listings.status, 'Sold'));

  // Get all categories
  const allCategories = await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .orderBy(categories.name);

  // Build conditions for active listings
  const conditions = [eq(listings.status, 'Active')];
  if (categoryId !== null) {
    conditions.push(eq(listings.categoryId, categoryId));
  }

  // Get active listings with pagination and sorting
  const activeListings = await db
    .select({
      id: listings.id,
      title: listings.title,
      price: listings.price,
      categoryId: listings.categoryId,
      category: categories.name,
      createdAt: listings.createdAt,
      sellerId: listings.sellerId,
    })
    .from(listings)
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .where(and(...conditions))
    .orderBy(sortOrder === 'desc' ? desc(listings.createdAt) : asc(listings.createdAt))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  // Get total count of filtered listings
  const [totalCount] = await db
    .select({ count: count() })
    .from(listings)
    .where(and(...conditions));

  // Batch fetch photos for all listings
  const listingIds = activeListings.map(listing => listing.id);
  const listingPhotoLinks = await db
    .select({
      listingId: listingPhotos.listingId,
      photoId: listingPhotos.photoId,
    })
    .from(listingPhotos)
    .where(and(inArray(listingPhotos.listingId, listingIds)))
    .limit(listingIds.length);

  const photoIds = listingPhotoLinks.map(link => link.photoId);
  const photosData = await db
    .select({
      id: photos.id,
      image: photos.image,
    })
    .from(photos)
    .where(and(inArray(photos.id, photoIds)));

  const photoMap = new Map(
    photosData.map(photo => [photo.id, photo.image])
  );

  const listingsWithPhotos: ShortListing[] = activeListings.map(listing => {
    const photoLink = listingPhotoLinks.find(link => link.listingId === listing.id);
    const photo = photoLink ? photoMap.get(photoLink.photoId) ?? null : null;
    return {
      ...listing,
      categoryId: listing.categoryId,
      sellerId: listing.sellerId,
      photo,
    };
  });

  return {
    ...user,
    activeListingsCount: activeCount?.count || 0,
    archivedListingsCount: archivedCount?.count || 0,
    soldListingsCount: soldCount?.count || 0,
    activeListings: listingsWithPhotos,
    totalListings: totalCount?.count || 0,
    categories: allCategories,
  };
}

export async function updateUser(user: User): Promise<User> {
  const result = await db.update(users).set(user).where(eq(users.id, user.id)).returning()
  return result[0]
}

export async function updateResetToken(id: number, token: string, expires: Date): Promise<User> {
  const result = await db
    .update(users)
    .set({
      password_reset_token: token,
      password_reset_expires: expires,
    })
    .where(eq(users.id, id))
    .returning()

  return result[0]
}

export async function validateResetToken(id: number, token: string): Promise<boolean> {
  if (!id || !token) return false

  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, id),
        isNotNull(users.password_reset_token),
        eq(users.password_reset_token, token),
        gt(users.password_reset_expires, new Date())
      )
    )
    .limit(1)

  return result.length > 0
}


export async function getProfileImage(id: number | null): Promise<string | null> {
  if (!id) {
    return null
  }
  const result = await db
    .select({ image: photos.image })
    .from(photos)
    .where(eq(photos.id, id))
    .limit(1)
  return result[0]?.image || null
}

export async function updateUserProfile(bio?: string, profileImage?: string | null): Promise<User> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be signed in to update your profile')
  }

  const userId = parseInt(session.user.id)
  const userData = await findUserById(userId)

  if (!userData) {
    throw new Error('User not found')
  }

  if (profileImage) {
    const photoData = await insertPhoto(profileImage)

    if (!photoData) {
      throw new Error('Photo not found')
    }

    userData.profileImageId = photoData.id
  }

  return updateUser({
    ...userData,
    bio: bio !== undefined ? bio : userData.bio,
    profileImageId: userData.profileImageId,
    updatedAt: new Date(),
  })
}