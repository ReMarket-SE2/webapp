import { db } from '../index';
import { users, type NewUser, type User } from '../schema/users';
import { eq } from 'drizzle-orm';

export const usersRepository = {
  // Get all users
  getAll: async (): Promise<User[]> => {
    return db.select().from(users);
  },

  // Get user by ID
  getById: async (id: number): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  },

  // Get user by username
  getByUsername: async (username: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  },

  // Get user by email
  getByEmail: async (email: string): Promise<User | undefined> => {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  },

  // Create a new user
  create: async (user: NewUser): Promise<User> => {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  },

  // Update a user
  update: async (id: number, user: Partial<NewUser>): Promise<User | undefined> => {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  },

  // Delete a user
  delete: async (id: number): Promise<void> => {
    await db.delete(users).where(eq(users.id, id));
  },
}; 