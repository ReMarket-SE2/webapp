import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, and, gt, isNotNull } from 'drizzle-orm'
import { User } from '@/lib/db/schema'

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