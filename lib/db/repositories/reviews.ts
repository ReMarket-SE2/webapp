import { db } from '..';
import { reviews, NewReview, Review } from '../schema/reviews';
import { eq, and } from 'drizzle-orm';

export const reviewsRepository = {
  /**
   * Create a new review
   */
  create: async (review: NewReview): Promise<Review> => {
    const result = await db.insert(reviews).values(review).returning();
    return result[0];
  },

  /**
   * Get a review by ID
   */
  getById: async (id: number): Promise<Review | undefined> => {
    const result = await db.select().from(reviews).where(eq(reviews.id, id));
    return result[0];
  },

  /**
   * Get all reviews for a listing
   */
  getByListingId: async (listingId: number): Promise<Review[]> => {
    return await db.select().from(reviews).where(eq(reviews.listingId, listingId));
  },

  /**
   * Get all reviews by a user
   */
  getByUserId: async (userId: number): Promise<Review[]> => {
    return await db.select().from(reviews).where(eq(reviews.userId, userId));
  },

  /**
   * Get a review by user ID and listing ID
   */
  getByUserAndListingId: async (userId: number, listingId: number): Promise<Review | undefined> => {
    const result = await db
      .select()
      .from(reviews)
      .where(and(eq(reviews.userId, userId), eq(reviews.listingId, listingId)));
    return result[0];
  },

  /**
   * Update a review
   */
  update: async (id: number, review: Partial<NewReview>): Promise<Review | undefined> => {
    const result = await db
      .update(reviews)
      .set(review)
      .where(eq(reviews.id, id))
      .returning();
    return result[0];
  },

  /**
   * Delete a review
   */
  delete: async (id: number): Promise<void> => {
    await db.delete(reviews).where(eq(reviews.id, id));
  },

  /**
   * Calculate average score for a listing
   */
  getAverageScoreForListing: async (listingId: number): Promise<number | null> => {
    const result = await db
      .select({
        averageScore: db.fn.avg(reviews.score).as('average_score')
      })
      .from(reviews)
      .where(eq(reviews.listingId, listingId));
    
    return result[0]?.averageScore;
  }
}; 