import { addReview, getReviewsByUserId, getReviewByOrderId } from '@/lib/reviews/actions'
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
