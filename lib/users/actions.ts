import { db } from '@/lib/db'
import { users, photos } from '@/lib/db/schema'
import { eq, and, gt, isNotNull } from 'drizzle-orm'
import { User } from '@/lib/db/schema'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export class UserAction {
  protected table = users

  async findByEmail(email: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    return result[0] || null
  }

  async findByUsername(username: string): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1)

    return result[0] || null
  }

  async create(data: Omit<User, 'id'>): Promise<User> {
    const result = await db
      .insert(users)
      .values({ ...data })
      .returning()

    return result[0]
  }

  async exists(id: number): Promise<boolean> {
    const result = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return result.length > 0
  }

  async findById(id: number): Promise<User | null> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1)

    return result[0] || null
  }

  async update(user: User): Promise<User> {
    const result = await db
      .update(users)
      .set(user)
      .where(eq(users.id, user.id))
      .returning()

    return result[0]
  }

  async updateResetToken(id: number, token: string, expires: Date): Promise<User> {
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

  async validateResetToken(id: number, token: string): Promise<boolean> {
    if (!id || !token) {
      return false
    }

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
}

export const userAction = new UserAction()

// Profile update types
interface ProfileUpdateData {
  bio?: string;
  profileImage?: string | null;
}

// Server action to update user profile
export async function updateUserProfile(data: ProfileUpdateData): Promise<User> {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error('Unauthorized: You must be signed in to update your profile');
  }
  
  const userId = parseInt(session.user.id);
  const userData = await userAction.findById(userId);
  
  if (!userData) {
    throw new Error('User not found');
  }
  
  // First handle the profile image if provided
  let profileImageId = userData.profileImageId;
  
  if (data.profileImage !== undefined) {
    if (data.profileImage) {
      // Create or update profile image
      const photoResult = await db
        .insert(photos)
        .values({
          image: data.profileImage,
        })
        .returning();
      
      profileImageId = photoResult[0].id;
    } else {
      // If null was passed, remove profile image reference
      profileImageId = null;
    }
  }
  
  // Update user profile
  return userAction.update({
    ...userData,
    bio: data.bio !== undefined ? data.bio : userData.bio,
    profileImageId,
    updatedAt: new Date(),
  });
}

// Server action to get a user profile (own or others)
export async function getUserProfile(userId: number): Promise<{user: User, blocked: boolean} | null> {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id ? parseInt(session.user.id) : null;
  
  const userData = await userAction.findById(userId);
  
  if (!userData) {
    return null;
  }
  
  // In a real app, check if the user is blocked
  // This is just a placeholder - you would implement actual blocking logic
  const isBlocked = false;
  
  // Only allow viewing if not blocked or it's the user's own profile
  if (isBlocked && currentUserId !== userId) {
    return { user: userData, blocked: true };
  }
  
  return { user: userData, blocked: false };
}