// Mock the entire database module and set up mock functions before importing the module under test
jest.mock('@/lib/db', () => {
  const mockSelect = jest.fn();
  const mockExecute = jest.fn();

  // Helper to create a full mock chain object
  function createMockChain(): any {
    return {
      from: jest.fn(() => chain),
      where: jest.fn(() => chain),
      orderBy: jest.fn(() => chain),
      limit: jest.fn(() => chain),
      offset: jest.fn(() => chain),
      execute: mockExecute,
    };
  }
  const chain: any = createMockChain();
  mockSelect.mockImplementation(() => chain);

  return {
    db: {
      select: mockSelect,
    },
    __mocks: {
      mockSelect,
      mockExecute,
      chain,
    },
  };
});

import { listings } from '@/lib/db/schema/listings';
import { getAllListings } from '@/lib/listings/actions';

// Get the mocks from the module
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { __mocks } = require('@/lib/db');
const { mockSelect, mockExecute } = __mocks;

describe('listings actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllListings', () => {
    it('should return empty array when no listings exist', async () => {
      // Mock execute to return empty arrays for both the count query and the main query
      mockExecute.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      const result = await getAllListings();

      expect(result).toEqual({ listings: [], totalCount: 0 });
      expect(mockSelect).toHaveBeenCalled();
    });

    it('should return array of listings when they exist', async () => {
      const fixedDate = new Date('2025-04-22T17:33:44.366Z');
      const mockListings = [
        { id: 1, title: 'Test Listing 1', price: '100', categoryId: null, createdAt: fixedDate },
        { id: 2, title: 'Test Listing 2', price: '200', categoryId: null, createdAt: fixedDate },
      ];

      // The order of execute() calls in getAllListings:
      // 1. countQuery.execute() -> [mockListings]
      // 2. main listings query.execute() -> [mockListings]
      // For each listing:
      //    a. listingPhotos for photo -> []
      //    b. photos for photo -> []
      //    c. categories for category -> []
      // So for 2 listings: 2 * 3 = 6 additional calls
      mockExecute.mockReset();
      mockExecute
        .mockResolvedValueOnce(mockListings) // countQuery
        .mockResolvedValueOnce(mockListings) // main listings query
        // Listing 1
        .mockResolvedValueOnce([]) // listingPhotos for listing 1
        // Listing 2
        .mockResolvedValueOnce([]); // listingPhotos for listing 2

      const result = await getAllListings();

      expect(result).toEqual({
        listings: mockListings.map(listing => ({
          id: listing.id,
          title: listing.title,
          price: listing.price,
          category: null,
          photo: null,
          createdAt: listing.createdAt,
        })),
        totalCount: mockListings.length,
      });
      expect(mockSelect).toHaveBeenCalled();
      // Ensure all execute calls were consumed (countQuery, main listings query, and one listingPhotos call per listing)
      expect(mockExecute).toHaveBeenCalledTimes(4);
    });
  });
});
