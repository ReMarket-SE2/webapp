import { db } from '../index';
import { categories, type NewCategory, type Category } from '../schema/categories';
import { eq } from 'drizzle-orm';

export const categoriesRepository = {
  // Get all categories
  getAll: async (): Promise<Category[]> => {
    return db.select().from(categories);
  },

  // Get category by ID
  getById: async (id: number): Promise<Category | undefined> => {
    const result = await db.select().from(categories).where(eq(categories.id, id));
    return result[0];
  },

  // Get category by name
  getByName: async (name: string): Promise<Category | undefined> => {
    const result = await db.select().from(categories).where(eq(categories.name, name));
    return result[0];
  },

  // Create a new category
  create: async (category: NewCategory): Promise<Category> => {
    const result = await db.insert(categories).values(category).returning();
    return result[0];
  },

  // Update a category
  update: async (id: number, category: Partial<NewCategory>): Promise<Category | undefined> => {
    const result = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return result[0];
  },

  // Delete a category
  delete: async (id: number): Promise<void> => {
    await db.delete(categories).where(eq(categories.id, id));
  },
}; 