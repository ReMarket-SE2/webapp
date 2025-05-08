import { Review } from '@/lib/db/schema/reviews';

export const mockReviews: Review[] = [
  {
    id: 1,
    title: "Great seller, fast shipping!",
    score: 5,
    description: "The item was exactly as described and arrived quickly. Would definitely buy from this seller again.",
    userId: 2,
    listingId: 1,
    createdAt: new Date('2024-03-15T10:30:00Z'),
  },
  {
    id: 2,
    title: "Good experience overall",
    score: 4,
    description: "The product was good quality, but shipping took a bit longer than expected.",
    userId: 3,
    listingId: 2,
    createdAt: new Date('2024-03-10T15:45:00Z'),
  },
  {
    id: 3,
    title: "Excellent communication",
    score: 5,
    description: "The seller was very responsive and helpful throughout the process.",
    userId: 4,
    listingId: 3,
    createdAt: new Date('2024-03-05T09:15:00Z'),
  },
  {
    id: 4,
    title: "Item as described",
    score: 4,
    description: "The item matched the description perfectly. Very satisfied with the purchase.",
    userId: 5,
    listingId: 4,
    createdAt: new Date('2024-03-01T14:20:00Z'),
  },
  {
    id: 5,
    title: "Would recommend",
    score: 5,
    description: "Great seller, great product, great price. Everything was perfect!",
    userId: 6,
    listingId: 5,
    createdAt: new Date('2024-02-25T11:10:00Z'),
  },
];

export const mockReviewStats = {
  averageScore: 4.6,
  totalReviews: mockReviews.length,
}; 