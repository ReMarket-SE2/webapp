jest.mock('@/lib/db', () => {
  const select = jest.fn()
  const insert = jest.fn()
  const del = jest.fn()
  return { db: { select, insert, delete: del } }
})

import { db } from '@/lib/db'
import * as actions from '@/lib/wishlist/actions'
import { wishlists } from '@/lib/db/schema/wishlists'
import { wishlistListings } from '@/lib/db/schema/wishlist_listings'
import { listings } from '@/lib/db/schema/listings'

// cast drizzledb fns to Jest mocks
const selectMock = db.select as jest.Mock
const insertMock = db.insert as jest.Mock
const deleteMock = db.delete as jest.Mock

describe('wishlist actions', () => {
  beforeEach(() => jest.clearAllMocks())

  it('getWishlistListingsByUserId returns joined listings', async () => {
    const fakeWishlist = { id: 1, userId: 42 }
    const builder1 = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeWishlist]),
    }
    const joinedResult = [{ id: 7, title: 'Example' }]
    const builder2 = {
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockResolvedValue(joinedResult),
    }

    selectMock
      .mockImplementationOnce(() => builder1)    // for getWishlistByUserId
      .mockImplementationOnce(() => builder2)    // for the join query

    const result = await actions.getWishlistListingsByUserId(42)

    expect(selectMock).toHaveBeenCalledTimes(2)
    expect(builder1.from).toHaveBeenCalledWith(wishlists)
    expect(builder2.innerJoin).toHaveBeenCalledWith(listings, expect.any(Object))
    expect(result).toEqual(joinedResult)
  })

  it('addListingToWishlist inserts one entry', async () => {
    const fakeWishlist = { id: 2, userId: 1 }
    const selectBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeWishlist]),
    }
    const insertBuilder = { values: jest.fn().mockResolvedValue({ success: true }) }

    selectMock.mockImplementationOnce(() => selectBuilder)
    insertMock.mockReturnValue(insertBuilder)

    const res = await actions.addListingToWishlist(1, 99)

    expect(insertMock).toHaveBeenCalledWith(wishlistListings)
    expect(insertBuilder.values).toHaveBeenCalledWith({
      wishlistId: fakeWishlist.id,
      listingId: 99,
    })
    expect(res).toEqual({ success: true })
  })

  it('removeListingFromWishlist deletes the right record', async () => {
    const fakeWishlist = { id: 3, userId: 5 }
    const selectBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeWishlist]),
    }
    const deleteBuilder = { where: jest.fn().mockResolvedValue({ deleted: 1 }) }

    selectMock.mockImplementationOnce(() => selectBuilder)
    deleteMock.mockReturnValue(deleteBuilder)

    const res = await actions.removeListingFromWishlist(5, 123)

    expect(deleteMock).toHaveBeenCalledWith(wishlistListings)
    expect(deleteBuilder.where).toHaveBeenCalled()
    expect(res).toEqual({ deleted: 1 })
  })

  it('clearWishlist removes all entries', async () => {
    const fakeWishlist = { id: 7, userId: 9 }
    const selectBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([fakeWishlist]),
    }
    const deleteBuilder = { where: jest.fn().mockResolvedValue({ cleared: true }) }

    selectMock.mockImplementationOnce(() => selectBuilder)
    deleteMock.mockReturnValue(deleteBuilder)

    const res = await actions.clearWishlist(9)

    expect(deleteMock).toHaveBeenCalledWith(wishlistListings)
    expect(deleteBuilder.where).toHaveBeenCalledWith(expect.any(Object))
    expect(res).toEqual({ cleared: true })
  })

  it('createWishlist inserts a new wishlist', async () => {
    const insertBuilder = { 
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 11 }])
    }
    insertMock.mockReturnValue(insertBuilder)

    const res = await actions.createWishlist(77)

    expect(insertMock).toHaveBeenCalledWith(wishlists)
    expect(insertBuilder.values).toHaveBeenCalledWith({ userId: 77 })
    expect(res).toEqual({ id: 11 })
  })

  it('deleteWishlist removes the wishlist record', async () => {
    const deleteBuilder = { where: jest.fn().mockResolvedValue({ success: true }) }
    deleteMock.mockReturnValue(deleteBuilder)

    const res = await actions.deleteWishlist(13)

    expect(deleteMock).toHaveBeenCalledWith(wishlists)
    expect(deleteBuilder.where).toHaveBeenCalledWith(expect.any(Object))
    expect(res).toEqual({ success: true })
  })

  it('creates a new wishlist if none is found', async () => {
    const insertBuilder = { 
      values: jest.fn().mockReturnThis(),
      returning: jest.fn().mockResolvedValue([{ id: 15 }])
    }
    const selectBuilder = {
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue([]),
      innerJoin: jest.fn().mockReturnThis(),
    }

    selectMock.mockImplementationOnce(() => selectBuilder)
    insertMock.mockReturnValue(insertBuilder)

    selectMock.mockImplementationOnce(() => selectBuilder)
    await actions.getWishlistListingsByUserId(99)

    expect(selectMock).toHaveBeenCalledWith()
    expect(insertMock).toHaveBeenCalledWith(wishlists)
    expect(insertBuilder.values).toHaveBeenCalledWith({ userId: 99 })
  })
})
