import { db } from '@/lib/db'
import { users, photos } from '@/lib/db/schema'
import { eq, and, gt, isNotNull } from 'drizzle-orm'
import { User } from '@/lib/db/schema'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { photosActions } from '@/lib/photos/actions'

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

  async getProfileImage(id: number | null): Promise<string | null> {
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

  async updateUserProfile(bio?: string, profileImage?: string | null): Promise<User> {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      throw new Error('Unauthorized: You must be signed in to update your profile')
    }

    const userId = parseInt(session.user.id)
    const userData = await this.findById(userId)

    if (!userData) {
      throw new Error('User not found')
    }

    if (profileImage) {
      const photoData = await photosActions.insertPhoto(profileImage)

      if (!photoData) {
        throw new Error('Photo not found')
      }

      userData.profileImageId = photoData.id
    }

    return this.update({
      ...userData,
      bio: bio !== undefined ? bio : userData.bio,
      profileImageId: userData.profileImageId,
      updatedAt: new Date(),
    })
  }
}

export const userAction = new UserAction()
