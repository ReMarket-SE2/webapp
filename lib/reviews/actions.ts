'use server';

import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema/reviews'
import { NewReview } from '@/lib/db/schema/reviews'
import { eq, desc, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { checkUserSuspension } from '@/lib/auth'

const reviewSchema = z.object({
  title: z.string().min(1, 'Title is required').max(120, 'Title must be at most 120 characters'),
  score: z.number().int().min(1, 'Score must be at least 1').max(5, 'Score must be at most 5'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be at most 1000 characters'),
  userId: z.number().int(),
  orderId: z.number().int(),
})

export async function addReview(data: NewReview): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user is suspended
    await checkUserSuspension(data.userId);
    
    const validated = reviewSchema.parse(data)
    await db.insert(reviews).values(validated)
    return { success: true }
  } catch (error) {
    if (error instanceof z.ZodError)
      return { success: false, error: error.errors[0].message }
    else if (error instanceof Error) {
      return { success: false, error: error.message}
    }
    return { success: false, error: 'Failed to add review' }
  }
}

export async function getReviewsByUserId(userId: number) {
  return db.select().from(reviews).where(eq(reviews.userId, userId)).orderBy(desc(reviews.createdAt))
}

export async function getReviewByOrderId(orderId: number) {
  return db.select().from(reviews).where(eq(reviews.orderId, orderId)).limit(1).then(rows => rows[0])
}

export interface ReviewStats {
  averageScore: number;
  totalReviews: number;
}

export async function getReviewStatsByUserId(userId: number): Promise<ReviewStats> {
  const rows = await db.select({ score: reviews.score }).from(reviews).where(eq(reviews.userId, userId));
  if (!rows.length) return { averageScore: 0, totalReviews: 0 };
  const totalReviews = rows.length;
  const averageScore = rows.reduce((sum, r) => sum + r.score, 0) / totalReviews;
  return { averageScore, totalReviews };
}

export async function getReviewExistenceByOrderIds(orderIds: number[]): Promise<Record<number, boolean>> {
  if (!orderIds.length) return {};
  const rows = await db.select({ orderId: reviews.orderId }).from(reviews).where(inArray(reviews.orderId, orderIds));
  const found = new Set(rows.map(r => r.orderId));
  const result: Record<number, boolean> = {};
  for (const id of orderIds) result[id] = found.has(id);
  return result;
}