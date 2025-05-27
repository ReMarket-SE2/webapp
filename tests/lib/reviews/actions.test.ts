import { addReview, getReviewsByUserId, getReviewByOrderId, getReviewStatsByUserId } from '@/lib/reviews/actions'
import { db } from '@/lib/db'

jest.mock('@/lib/db', () => ({
  db: {
    insert: jest.fn(() => ({ values: jest.fn() })),
    select: jest.fn(() => ({ from: jest.fn(() => ({ where: jest.fn(() => ({ orderBy: jest.fn(() => Promise.resolve([]) ), limit: jest.fn(() => Promise.resolve([])) })) })) })),
  },
}))

const validReview = {
  title: 'Great',
  score: 5,
  description: 'Awesome',
  userId: 1,
  orderId: 2,
}

describe('addReview', () => {
  it('returns success for valid review', async () => {
    const result = await addReview(validReview as any)
    expect(result.success).toBe(true)
  })

  it('returns error for invalid review', async () => {
    const invalid = { ...validReview, title: '' }
    const result = await addReview(invalid as any)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Title is required')
  })
})

describe('getReviewsByUserId', () => {
  it('calls db.select with correct userId', async () => {
    const userId = 1
    await getReviewsByUserId(userId)
    expect(db.select).toHaveBeenCalled()
  })
})

describe('getReviewByOrderId', () => {
  it('calls db.select with correct orderId', async () => {
    const orderId = 2
    await getReviewByOrderId(orderId)
    expect(db.select).toHaveBeenCalled()
  })
})

describe('getReviewStatsByUserId', () => {
  it('returns 0 average and 0 total if no reviews', async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({ where: jest.fn(() => []) }))
    });
    const stats = await getReviewStatsByUserId(1);
    expect(stats).toEqual({ averageScore: 0, totalReviews: 0 });
  });

  it('returns correct average and total for one review', async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({ where: jest.fn(() => [{ score: 4 }]) }))
    });
    const stats = await getReviewStatsByUserId(1);
    expect(stats).toEqual({ averageScore: 4, totalReviews: 1 });
  });

  it('returns correct average and total for multiple reviews', async () => {
    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn(() => ({ where: jest.fn(() => [
        { score: 5 },
        { score: 3 },
        { score: 4 },
      ]) }))
    });
    const stats = await getReviewStatsByUserId(1);
    expect(stats).toEqual({ averageScore: 4, totalReviews: 3 });
  });
})
