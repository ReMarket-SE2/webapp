'use server';

import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema/categories';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { eq, isNull } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import pg from 'postgres';

// Validation schema for category creation and update
const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  parentId: z.number().nullable().optional(),
});

/**
 * Get all categories, optionally with their relationships
 */
export async function getCategories(includeRelationships: boolean = false) {
  try {
    if (includeRelationships) {
      // Get categories with their parent/child relationships
      return await db.query.categories.findMany({
        with: {
          parent: true,
          children: true,
        },
      });
    } else {
      // Get just the categories
      return await db.select().from(categories);
    }
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw new Error('Failed to fetch categories');
  }
}

/**
 * Get top-level categories (categories without parents)
 */
export async function getTopLevelCategories() {
  try {
    return await db.select()
      .from(categories)
      .where(isNull(categories.parentId));
  } catch (error) {
    console.error('Error fetching top-level categories:', error);
    throw new Error('Failed to fetch top-level categories');
  }
}

/**
 * Create a new category
 */
export async function createCategory(data: z.infer<typeof categorySchema>) {
  // Check user authorization
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can create categories');
  }

  // Validate input data
  const validatedData = categorySchema.parse(data);
  
  try {
    // Insert the new category
    const result = await db.insert(categories).values({
      name: validatedData.name,
      parentId: validatedData.parentId || null,
    }).returning();

    // Revalidate the admin page
    revalidatePath('/admin');
    
    return result[0];
  } catch (error) {
    console.error('Error creating category:', error);
    if ((error as pg.PostgresError).code === '23505') {
      throw new Error('A category with this name already exists');
    }
    throw new Error('Failed to create category');
  }
}

/**
 * Update an existing category
 */
export async function updateCategory(id: number, data: z.infer<typeof categorySchema>) {
  // Check user authorization
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can update categories');
  }

  // Validate input data
  const validatedData = categorySchema.parse(data);
  
  try {
    // Make sure we're not setting a category as its own parent
    if (validatedData.parentId === id) {
      throw new Error('A category cannot be its own parent');
    }

    // Update the category
    const result = await db.update(categories)
      .set({
        name: validatedData.name,
        parentId: validatedData.parentId || null,
      })
      .where(eq(categories.id, id))
      .returning();

    // If no rows were updated, the category doesn't exist
    if (result.length === 0) {
      throw new Error('Category not found');
    }

    // Revalidate the admin page
    revalidatePath('/admin');
    
    return result[0];
  } catch (error) {
    console.error('Error updating category:', error);
    // If the error is one of the specific errors we've thrown, re-throw it.
    if (error instanceof Error && 
        (error.message === 'A category cannot be its own parent' || 
         error.message === 'Category not found')) {
      throw error;
    }
    // Handle PostgreSQL unique constraint violation
    if ((error as pg.PostgresError).code === '23505') {
      throw new Error('A category with this name already exists');
    }
    throw new Error('Failed to update category');
  }
}

/**
 * Delete a category
 */
export async function deleteCategory(id: number) {
  // Check user authorization
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    throw new Error('Unauthorized: Only admins can delete categories');
  }

  try {
    // Check if there are any subcategories
    const subcategories = await db.select()
      .from(categories)
      .where(eq(categories.parentId, id));
    
    if (subcategories.length > 0) {
      throw new Error('Cannot delete a category with subcategories');
    }

    // Check if there are any listings using this category
    // This assumes that listings have a categoryId field
    const listings = await db.query.listings.findMany({
      where: (listings) => eq(listings.categoryId, id),
    });

    if (listings.length > 0) {
      throw new Error('Cannot delete a category that has listings');
    }

    // Delete the category
    const result = await db.delete(categories)
      .where(eq(categories.id, id))
      .returning();

    // If no rows were deleted, the category doesn't exist
    if (result.length === 0) {
      throw new Error('Category not found');
    }

    // Revalidate the admin page
    revalidatePath('/admin');
    
    return result[0];
  } catch (error) {
    console.error('Error deleting category:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete category');
  }
}

// Helper to get the full category path (from root to leaf) for a given categoryId
export async function getCategoryPath(categoryId: number): Promise<{ id: number; name: string }[]> {
  const allCategories = await db.select().from(categories);
  const map = new Map<number, { id: number; name: string; parentId: number | null }>();
  for (const cat of allCategories) map.set(cat.id, cat);
  const path: { id: number; name: string }[] = [];
  let current = map.get(categoryId);
  while (current) {
    path.unshift({ id: current.id, name: current.name });
    current = current.parentId ? map.get(current.parentId) : undefined;
  }
  return path;
}