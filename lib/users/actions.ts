"use server"

import { db } from '@/lib/db'
import { users, photos, listings, listingPhotos, categories } from '@/lib/db/schema'
import { eq, and, gt, isNotNull, asc, desc, or, ilike, count, ne } from 'drizzle-orm' // Consolidated count import and added ne
import { User, UserRole, UserStatus, listingStatusEnum } from '@/lib/db/schema' // Ensured UserRole and UserStatus are imported
import { getServerSession } from 'next-auth/next'
import { authOptions, checkUserSuspension } from '@/lib/auth'
import { insertPhoto } from '@/lib/photos/actions'
import { createWishlist } from '@/lib/wishlist/actions'
import { ShortListing } from '@/lib/listings/actions'
import { revalidatePath } from 'next/cache'; // Added revalidatePath import

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

export interface UserListingsCounts {
  activeListingsCount: number;
  archivedListingsCount: number;
  soldListingsCount: number;
}

/**
 * Fetches a user by ID without any additional data.
 * Use this for basic user operations like authentication, password reset, etc.
 */
export async function getUserById(id: number): Promise<User | null> {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user || null;
}

/**
 * Fetches user's listing counts by status for a specific seller.
 */
export async function getUserListingsCounts(sellerId: number): Promise<UserListingsCounts> {
  // Execute all count queries in parallel for better performance
  const [activeCountResult, archivedCountResult, soldCountResult] = await Promise.all([
    db
      .select({ count: count() })
      .from(listings)
      .where(and(eq(listings.status, listingStatusEnum.enumValues[0]), eq(listings.sellerId, sellerId))),
    db
      .select({ count: count() })
      .from(listings)
      .where(and(eq(listings.status, listingStatusEnum.enumValues[1]), eq(listings.sellerId, sellerId))),
    db
      .select({ count: count() })
      .from(listings)
      .where(and(eq(listings.status, listingStatusEnum.enumValues[3]), eq(listings.sellerId, sellerId)))
  ]);

  return {
    activeListingsCount: activeCountResult[0]?.count || 0,
    archivedListingsCount: archivedCountResult[0]?.count || 0,
    soldListingsCount: soldCountResult[0]?.count || 0,
  };
}

/**
 * Fetches user's active listings with proper photo attachment.
 * Each listing gets exactly one photo (the first one found).
 */
export async function getUserActiveListings(
  sellerId: number,
  options: UserListingsOptions = {}
): Promise<{ listings: ShortListing[]; totalCount: number }> {
  const {
    page = 1,
    pageSize = 10,
    sortOrder = 'desc',
    categoryId = null,
  } = options;

  // Build conditions for active listings
  const conditions = [eq(listings.status, 'Active'), eq(listings.sellerId, sellerId)];
  if (categoryId !== null) {
    conditions.push(eq(listings.categoryId, categoryId));
  }

  // Get total count of filtered listings
  const [totalCountResult] = await db
    .select({ count: count() })
    .from(listings)
    .where(and(...conditions));

  // Get active listings with pagination and sorting
  const activeListings = await db
    .selectDistinctOn([listings.createdAt, listings.id], {
      id: listings.id,
      title: listings.title,
      price: listings.price,
      categoryId: listings.categoryId,
      category: categories.name,
      createdAt: listings.createdAt,
      sellerId: listings.sellerId,
      photo: photos.image
    })
    .from(listings)
    .leftJoin(categories, eq(listings.categoryId, categories.id))
    .leftJoin(listingPhotos, eq(listings.id, listingPhotos.listingId))
    .leftJoin(photos, eq(listingPhotos.photoId, photos.id))
    .where(and(...conditions))
    .orderBy(sortOrder === 'desc' ? desc(listings.createdAt) : asc(listings.createdAt), listings.id)
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return {
    listings: activeListings,
    totalCount: totalCountResult?.count || 0,
  };
}

/**
 * Fetches all categories for display.
 */
export async function getAllCategories(): Promise<{ id: number; name: string }[]> {
  return await db
    .select({
      id: categories.id,
      name: categories.name,
    })
    .from(categories)
    .orderBy(categories.name);
}

/**
 * Fetches a user with their listing counts and active listings.
 * Use this for user profile pages that need to display listing information.
 */
export async function findUserByIdWithListings(
  id: number,
  options: UserListingsOptions = {}
): Promise<UserWithListingCounts | null> {
  // Get base user data
  const user = await getUserById(id);
  if (!user) {
    return null;
  }

  // Get listing counts
  const listingsCounts = await getUserListingsCounts(id);

  // Get active listings
  const { listings: activeListings, totalCount } = await getUserActiveListings(id, options);

  // Get all categories
  const allCategories = await getAllCategories();

  return {
    ...user,
    ...listingsCounts,
    activeListings,
    totalListings: totalCount,
    categories: allCategories,
  };
}

export interface AdminUserListOptions {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
  sortOrder?: 'asc' | 'desc';
  sortBy?: 'id' | 'username' | 'email' | 'createdAt' | 'role' | 'status'; // Added 'id' as a sort option
  role?: UserRole;
  status?: UserStatus;
}

export async function getAllUsersForAdmin(
  options: AdminUserListOptions = {}
): Promise<{ users: User[]; totalUsers: number }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can access this feature.');
  }

  const {
    page = 1,
    pageSize = 10,
    searchTerm,
    sortOrder = 'desc',
    sortBy = 'createdAt',
    role,
    status,
  } = options;

  const conditions = [];
  if (searchTerm) {
    const searchNumber = parseInt(searchTerm.trim(), 10);
    if (!isNaN(searchNumber) && searchTerm.trim() === searchNumber.toString()) {
      conditions.push(
        or(
          ilike(users.username, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`),
          eq(users.id, searchNumber)
        )
      );
    } else {
      conditions.push(
        or(
          ilike(users.username, `%${searchTerm}%`),
          ilike(users.email, `%${searchTerm}%`)
        )
      );
    }
  }
  if (role) {
    conditions.push(eq(users.role, role));
  }
  if (status) {
    conditions.push(eq(users.status, status));
  }

  const queryCondition = conditions.length > 0 ? and(...conditions) : undefined;

  const usersResult = await db
    .select()
    .from(users)
    .where(queryCondition)
    .orderBy(
      sortOrder === 'asc'
        ? asc(users[sortBy])
        : desc(users[sortBy])
    )
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  const [totalCountResult] = await db
    .select({ count: count(users.id) }) // Use count(users.id) for clarity
    .from(users)
    .where(queryCondition);

  return {
    users: usersResult,
    totalUsers: totalCountResult?.count || 0,
  };
}

export interface AdminUpdateUserPayload {
  username?: string;
  role?: UserRole;
  status?: UserStatus;
}

export async function adminUpdateUser(
  userId: number,
  data: AdminUpdateUserPayload
): Promise<User> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can perform this action.');
  }

  const currentUserId = parseInt(session.user.id);
  const [targetUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!targetUser) {
    throw new Error('User not found.');
  }

  if (userId === currentUserId) {
    if (data.role && data.role !== 'admin') {
      throw new Error("Admins cannot change their own role to a non-admin role.");
    }
    const currentStatus: UserStatus = targetUser.status;
    const newStatus: UserStatus | undefined = data.status;

    if (newStatus && currentStatus === 'active' && newStatus !== 'active') {
       throw new Error("Admins cannot change their own status from 'active' to a non-active status through this panel.");
    }
  }

  const updateData: Partial<Omit<User, 'id' | 'createdAt' | 'email' | 'passwordHash' | 'profileImageId' | 'bio' | 'password_reset_token' | 'password_reset_expires'>> & { updatedAt: Date } = { updatedAt: new Date() };

  if (data.username !== undefined && data.username !== targetUser.username) {
    const existingUserByUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, data.username), ne(users.id, userId))) // Corrected: use ne(users.id, userId)
      .limit(1);
    if (existingUserByUsername.length > 0) { // Corrected: simplified condition
        throw new Error('Username is already taken.');
    }
    updateData.username = data.username;
  }

  if (data.role !== undefined && data.role !== targetUser.role) {
    updateData.role = data.role;
  }

  if (data.status !== undefined && data.status !== targetUser.status) {
    updateData.status = data.status;
  }
  
  // Check if there are any actual changes other than updatedAt
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { updatedAt: _updatedAt, ...changesToApply } = updateData;
  if (Object.keys(changesToApply).length === 0) {
    return targetUser; // Return the original user if no changes
  }

  const [updatedUser] = await db
    .update(users)
    .set(updateData) // Pass the full updateData including updatedAt
    .where(eq(users.id, userId))
    .returning();

  if (!updatedUser) {
    // This case should ideally not be reached if targetUser was found and Object.keys(changesToApply).length > 0
    // unless there's a concurrent deletion or a very specific DB issue.
    throw new Error('User not found or update failed unexpectedly.');
  }
  
  revalidatePath('/admin');
  revalidatePath('/user/' + userId);
  // If roles/status affect other parts of the app, revalidate those paths too.
  // e.g. revalidatePath('/listings') if user status affects their listings visibility.

  return updatedUser;
} // Fixed missing '}' and added return for no-change case

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
  
  // Check if user is suspended
  await checkUserSuspension(userId);
  
  const userData = await getUserById(userId)

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

export async function updateEmailVerificationToken(id: number, token: string, expires: Date): Promise<User> {
  const result = await db
    .update(users)
    .set({
      email_verification_token: token,
      email_verification_expires: expires,
    })
    .where(eq(users.id, id))
    .returning()

  return result[0]
}

export async function validateEmailVerificationToken(id: number, token: string): Promise<boolean> {
  if (!id || !token) return false

  const result = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.id, id),
        isNotNull(users.email_verification_token),
        eq(users.email_verification_token, token),
        gt(users.email_verification_expires, new Date())
      )
    )
    .limit(1)

  return result.length > 0
}

export async function verifyUserEmail(id: number): Promise<User> {
  const result = await db
    .update(users)
    .set({
      emailVerified: true,
      email_verification_token: null,
      email_verification_expires: null,
      status: 'active',
      updatedAt: new Date(),      
    })
    .where(eq(users.id, id))
    .returning()

  return result[0]
}