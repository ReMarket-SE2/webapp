import {
  createListing,
  getListingById,
  getAllListings,
  updateListing,
  deleteListing,
} from '@/lib/listings/actions';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema/listings';
import { photos } from '@/lib/db/schema/photos';
import { listingPhotos } from '@/lib/db/schema/listing_photos';
import { revalidatePath } from 'next/cache';
import { eq, inArray, relations, sql } from 'drizzle-orm';

// Mock the database and revalidatePath
jest.mock('@/lib/db', () => {
  // Create a chain-able mock for db operations
  const mockInsertChain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockUpdateChain = {
    set: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  const mockDeleteChain = {
    where: jest.fn().mockReturnThis(),
  };

  const mockDb = {
    insert: jest.fn(() => mockInsertChain),
    update: jest.fn(() => mockUpdateChain),
    delete: jest.fn(() => mockDeleteChain),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  return { db: mockDb };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('drizzle-orm', () => {
  const actualDrizzleOrm = jest.requireActual('drizzle-orm');
  return {
    ...actualDrizzleOrm,
    eq: jest.fn((field, value) => ({
      _operator: 'eq',
      _left: field,
      _right: value,
      toString: () => `mockEq(${field?.name || String(field)}, ${String(value)})`,
    })),
    inArray: jest.fn((field, values) => ({
      _operator: 'inArray',
      _field: field,
      _values: values,
      toString: () => `mockInArray(${field?.name || String(field)}, ${String(values)})`,
    })),
    // relations: jest.fn(), // Only if 'relations' is directly used and needs mocking
    sql: jest.fn((strings, ...values) => {
      return {
        _strings: strings,
        _values: values,
        toString: () => `mockSql(${strings.join('')}, ${values.join(', ')})`,
      };
    }),

    limit: jest.fn((count) => {
      return {
        _operator: 'limit',
        _count: count,
        toString: () => `mockLimit(${count})`,
      };
    }),

    offset: jest.fn((count) => {
      return {
        _operator: 'offset',
        _count: count,
        toString: () => `mockOffset(${count})`,
      };
    }),

    relations: jest.fn((table, relation) => {
      return {
        _table: table,
        _relation: relation,
        toString: () => `mockRelations(${table?.name || String(table)}, ${relation})`,
      };
    }),
  };
});

jest.mock('@/lib/db/schema/listings', () => ({
  listings: {},
}));

jest.mock('@/lib/db/schema/photos', () => ({
  photos: {},
}));

jest.mock('@/lib/db/schema/listing_photos', () => ({
  listingPhotos: {},
}));

describe('Listing Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe('createListing', () => {
    test('should create a listing successfully', async () => {
      // Setup mocks for a successful listing creation
      const mockListingId = 123;
      const mockDbInsert = db.insert as jest.Mock;
      const mockValues = mockDbInsert().values;
      const mockReturning = mockDbInsert().returning;

      mockReturning.mockResolvedValueOnce([{ id: mockListingId }]);

      const listingData = {
        title: 'Test Listing',
        price: 100,
        description: 'Test Description',
        longDescription: 'Detailed test description',
        status: 'Active' as const,
        sellerId: 1,
      };

      // No photos in this test
      const result = await createListing(listingData, []);

      // Verify the results
      expect(result).toEqual({
        success: true,
        listingId: mockListingId,
      });

      // Verify the listing was inserted with correct data
      expect(db.insert).toHaveBeenCalledWith(listings);
      expect(mockValues).toHaveBeenCalledWith({
        title: 'Test Listing',
        price: '100', // Should be converted to string
        description: 'Test Description',
        longDescription: 'Detailed test description',
        categoryId: null,
        status: 'Active',
        sellerId: 1,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      // Verify cache was revalidated
      expect(revalidatePath).toHaveBeenCalledWith('/listings');
    });

    test('should handle photo uploads', async () => {
      // Setup mocks for a successful listing and photo creation
      const mockListingId = 123;
      const mockPhotoId = 456;

      const mockDbInsert = db.insert as jest.Mock;

      // First call for the listing
      mockDbInsert.mockImplementationOnce(() => ({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{ id: mockListingId }]),
      }));

      // Second call for the photo
      mockDbInsert.mockImplementationOnce(() => ({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{ id: mockPhotoId }]),
      }));

      // Third call for linking photo to listing
      mockDbInsert.mockImplementationOnce(() => ({
        values: jest.fn().mockReturnThis(),
      }));

      const listingData = {
        title: 'Test Listing',
        price: 100,
        status: 'Draft' as const,
        sellerId: 1,
      };

      const photoData = ['data:image/jpeg;base64,test123'];

      const result = await createListing(listingData, photoData);

      // Verify the results
      expect(result).toEqual({
        success: true,
        listingId: mockListingId,
      });

      // Verify the photo was inserted and linked
      expect(db.insert).toHaveBeenCalledWith(photos);
      expect(db.insert).toHaveBeenCalledWith(listingPhotos);
    });

    test('should handle validation errors', async () => {
      const listingData = {
        title: '', // Empty title should fail validation
        price: 0, // Zero price should fail validation
        status: 'Draft' as const,
        sellerId: 1,
      };

      const result = await createListing(listingData, []);

      // Verify the results
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy(); // Should have some error message
    });
  });

  describe('getListingById', () => {
    const mockFullListingBase = {
      id: 123,
      title: 'Test Listing',
      price: '100.00',
      description: 'Test Description',
      longDescription: 'Detailed test description',
      status: 'Active' as const,
      createdAt: new Date('2023-01-01T00:00:00.000Z'),
      updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      // categoryId and sellerId will be added per test case
    };

    beforeEach(() => {
      (eq as jest.Mock).mockClear();
      (inArray as jest.Mock).mockClear();
      // Ensure db.select is reset for each test if it's being assigned to mockDbSelect
      // If db.select is consistently mocked via jest.mock, this might not be strictly necessary
      // but good for safety if tests modify db.select's behavior directly.
      (db.select as jest.Mock).mockClear(); 
    });

    test('should retrieve a listing by ID with photos, category, and seller', async () => {
      const mockListingWithCategoryAndSeller = {
        ...mockFullListingBase,
        categoryId: 1,
        sellerId: 1,
      };
      const photoLinks = [{ photoId: 1 }, { photoId: 2 }];
      const photoResults = [
        { id: 1, image: 'data:image/jpeg;base64,photo1' },
        { id: 2, image: 'data:image/jpeg;base64,photo2' },
      ];
      const mockCategory = { name: 'Test Category' };
      const mockUser = { id: 1, username: 'testseller', profileImageId: null, bio: 'Test bio' };
      const mockActiveCount = { count: 2 };
      const mockArchivedCount = { count: 1 };

      const mockDbSelect = db.select as jest.Mock;

      // 1. Mock for fetching the listing itself
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListingWithCategoryAndSeller]),
      }));
      // 2. Mock for fetching photo IDs from listingPhotos
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(photoLinks),
      }));
      // 3. Mock for fetching photo data from photos
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(photoResults),
      }));
      // 4. Mock for category name
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCategory]),
      }));
      // 5. Mock for seller info
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockUser]),
      }));
      // 6. Mock for seller active listings count (profileImageId is null, so no photo fetch for seller)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockActiveCount]),
      }));
      // 7. Mock for seller archived listings count
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockArchivedCount]),
      }));

      const result = await getListingById(123);

      expect(result).toEqual({
        ...mockListingWithCategoryAndSeller,
        photos: ['data:image/jpeg;base64,photo1', 'data:image/jpeg;base64,photo2'],
        categoryName: mockCategory.name,
        seller: {
          id: mockUser.id,
          username: mockUser.username,
          profileImage: null, // Because profileImageId was null
          bio: mockUser.bio,
          activeListingsCount: mockActiveCount.count,
          archivedListingsCount: mockArchivedCount.count,
        },
      });

      expect(eq).toHaveBeenCalledWith(listings.id, 123);
      expect(eq).toHaveBeenCalledWith(listingPhotos.listingId, 123);
      expect(inArray).toHaveBeenCalledWith(photos.id, [1, 2]);
    });

    test('should return null if listing not found', async () => {
      // Configure mock to return empty array (no listing found)
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      }));

      const result = await getListingById(999);

      // Verify the results
      expect(result).toBeNull();
    });

    test('should handle database errors when fetching listing', async () => {
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      }));

      const result = await getListingById(123);
      expect(result).toBeNull();
    });

    test('should handle database errors when fetching photo links, but return listing data', async () => {
      const mockListingWithCategoryAndSeller = {
        ...mockFullListingBase,
        categoryId: 1,
        sellerId: 1,
      };
      const mockCategory = { name: 'Test Category' };
      const mockUser = { id: 1, username: 'testseller', profileImageId: null, bio: 'Test bio' };
      const mockActiveCount = { count: 2 };
      const mockArchivedCount = { count: 1 };

      const mockDbSelect = db.select as jest.Mock;

      // 1. Mock for fetching the listing itself (successful)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListingWithCategoryAndSeller]),
      }));
      // 2. Mock for fetching photo IDs (fails)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValueOnce(new Error('DB error fetching photo links')),
      }));
      // 3. Mock for category name (still called)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCategory]),
      }));
      // 4. Mock for seller info (still called)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockUser]),
      }));
      // 5. Mock for seller active listings count
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockActiveCount]),
      }));
      // 6. Mock for seller archived listings count
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockArchivedCount]),
      }));

      const result = await getListingById(123);
      expect(result).toEqual({
        ...mockListingWithCategoryAndSeller,
        photos: [], // Photos should be empty due to the error
        categoryName: mockCategory.name,
        seller: {
          id: mockUser.id,
          username: mockUser.username,
          profileImage: null,
          bio: mockUser.bio,
          activeListingsCount: mockActiveCount.count,
          archivedListingsCount: mockArchivedCount.count,
        },
      });
    });

    test('should fetch a listing without photos if no photos are linked', async () => {
      const mockListingWithCategoryAndSeller = {
        ...mockFullListingBase,
        categoryId: 1,
        sellerId: 1,
      };
      const mockCategory = { name: 'Test Category' };
      const mockUser = { id: 1, username: 'testseller', profileImageId: null, bio: 'Test bio' };
      const mockActiveCount = { count: 2 };
      const mockArchivedCount = { count: 1 };

      const mockDbSelect = db.select as jest.Mock;

      // 1. Mock for fetching the listing itself
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListingWithCategoryAndSeller]),
      }));
      // 2. Mock for fetching photo IDs from listingPhotos (returns empty array)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      }));
      // 3. Mock for category name
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockCategory]),
      }));
      // 4. Mock for seller info
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([mockUser]),
      }));
      // 5. Mock for seller active listings count
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockActiveCount]),
      }));
      // 6. Mock for seller archived listings count
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockArchivedCount]),
      }));

      const result = await getListingById(123);

      expect(result).toEqual({
        ...mockListingWithCategoryAndSeller,
        photos: [],
        categoryName: mockCategory.name,
        seller: {
          id: mockUser.id,
          username: mockUser.username,
          profileImage: null,
          bio: mockUser.bio,
          activeListingsCount: mockActiveCount.count,
          archivedListingsCount: mockArchivedCount.count,
        },
      });

      expect(eq).toHaveBeenCalledWith(listings.id, 123);
      expect(eq).toHaveBeenCalledWith(listingPhotos.listingId, 123);
      expect(inArray).not.toHaveBeenCalled(); // Correct: photo data fetch is skipped
    });

    test('should fetch a listing without category and seller if not present', async () => {
      const mockListingNoCategoryNoSeller = {
        ...mockFullListingBase,
        categoryId: null,
        sellerId: null, // Explicitly null or ensure it's not set if your base doesn't have it
      };
      const photoLinks = [{ photoId: 1 }];
      const photoResults = [{ id: 1, image: 'data:image/jpeg;base64,photo1' }];

      const mockDbSelect = db.select as jest.Mock;

      // 1. Mock for fetching the listing itself
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListingNoCategoryNoSeller]),
      }));
      // 2. Mock for fetching photo IDs from listingPhotos
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(photoLinks),
      }));
      // 3. Mock for fetching photo data from photos
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce(photoResults),
      }));
      // No mocks for category or seller as they won't be called if IDs are null

      const result = await getListingById(123);

      expect(result).toEqual({
        ...mockListingNoCategoryNoSeller,
        photos: ['data:image/jpeg;base64,photo1'],
        categoryName: null, // Expect null as categoryId is null
        seller: undefined, // Expect undefined as sellerId is null
      });
    });

  });

  describe('getAllListings', () => {
    beforeEach(() => {
      // jest.resetAllMocks(); // Resets mocks to jest.fn(). Clears all instances and calls to constructor and all methods.
      jest.clearAllMocks(); // Clears all instances and calls to constructor and all methods. Does not reset implementations.
                           // This is often preferred if mocks are set up outside tests and meant to persist.
                           // Given the mocks are top-level, clearAllMocks is fine.
                           // If db.select().execute was stateful, resetAllMocks might be safer or manual reset of mockImplementationOnce.
    });

    test('should return all listings with default pagination', async () => {
      const mockListingsData = [
        { id: 1, title: 'Listing 1', price: '100', categoryId: null, createdAt: new Date(), status: 'Active' as const, sellerId: 1 },
        { id: 2, title: 'Listing 2', price: '200', categoryId: 1, createdAt: new Date(), status: 'Active' as const, sellerId: 1 },
      ];

      // Mock for the count query
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for the main listings query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for the first listing's photo link query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ photoId: 1 }]),
      }));

      // Mock for the first listing's photo data query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ image: 'data:image/jpeg;base64,photo1' }]),
      }));

      // Mock for the second listing's photo link query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ photoId: 1 }]),
      }));

      // Mock for the second listing's photo data query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ image: 'data:image/jpeg;base64,photo1' }]),
      }));

      // Mock for the second listing's category query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ name: 'Category 1' }]),
      }));

      const result = await getAllListings();

      expect(result).toEqual({
        listings: [
          {
            id: 1,
            title: 'Listing 1',
            price: '100',
            category: null,
            categoryId: null,
            sellerId: 1,
            photo: 'data:image/jpeg;base64,photo1',
            createdAt: expect.any(Date),
          },
          {
            id: 2,
            title: 'Listing 2',
            price: '200',
            category: 'Category 1',
            categoryId: 1,
            sellerId: 1,
            photo: 'data:image/jpeg;base64,photo1',
            createdAt: expect.any(Date),
          },
        ],
        totalCount: 2,
      });
    });

    test('should apply category filter', async () => {
      // Mock categories for getDescendantCategoryIds
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockImplementation((table) => {
          if (table && table.name === 'categories') {
            return Promise.resolve([
              { id: 2, parentId: null, name: 'Test Category' },
            ]);
          }
          return Promise.resolve([]);
        }),
      }));

      const mockListingsData = [
        { id: 1, title: 'Category Match', price: '300', categoryId: 2, createdAt: new Date(), status: 'Active' as const, sellerId: 1 },
      ];

      // Mock for count query with category filter
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for main query with category filter
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for photo link query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ photoId: 1 }]),
      }));

      // Mock for photo data query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ image: 'data:image/jpeg;base64,photo1' }]),
      }));

      // Mock for category query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ name: 'Test Category' }]),
      }));

      const result = await getAllListings({ categoryId: 2 });

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].title).toBe('Category Match');
      expect(result.listings[0].category).toBe('Test Category');
    });

    test('should handle pagination', async () => {
      const mockListingsData = [
        { id: 1, title: 'Page 1 Listing', price: '400', categoryId: null, createdAt: new Date(), status: 'Active' as const, sellerId: 1 },
      ];

      // Mock for count query with pagination
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for main query with pagination
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for photo link query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ photoId: 1 }]),
      }));

      // Mock for photo data query
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce([{ image: 'data:image/jpeg;base64,photo1' }]),
      }));

      const result = await getAllListings({ page: 1, pageSize: 1 });

      expect(result.listings).toHaveLength(1);
      expect(result.listings[0].title).toBe('Page 1 Listing');
      expect(result.totalCount).toBe(1);
    });

    test('should return empty results on database error', async () => {
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        execute: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      }));

      const result = await getAllListings();

      expect(result).toEqual({ listings: [], totalCount: 0 });
    });

    test('should not return sold listings', async () => {
      const mockListingsData = [
        { id: 1, title: 'Sold Listing', price: '500', categoryId: null, createdAt: new Date(), status: 'Sold' as const, sellerId: 1 },
      ];

      // Mock for count query with sold listings
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      // Mock for main query with sold listings
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        execute: jest.fn().mockResolvedValueOnce(mockListingsData),
      }));

      const result = await getAllListings();

      expect(result.listings).toHaveLength(0);
    });
  });

  describe('updateListing', () => {
    test('should update listing successfully without photos', async () => {
      const mockDbUpdate = db.update as jest.Mock;
      mockDbUpdate.mockReturnValueOnce({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      });
      const mockFormData = {
        title: 'Updated Listing',
        price: 150,
        description: 'Updated desc',
        longDescription: 'Updated long desc',
        categoryId: null,
        status: 'Active' as const,
        sellerId: 1,
      };
      const result = await updateListing(1, mockFormData, []);
      expect(result).toEqual({ success: true });
      expect(db.update).toHaveBeenCalledWith(listings);
      expect(revalidatePath).toHaveBeenCalledWith('/');
      expect(revalidatePath).toHaveBeenCalledWith('/listing/1');
    });

    test('should replace photos when new photo data is provided', async () => {
      const mockDbUpdate = db.update as jest.Mock;
      const mockDbDelete = db.delete as jest.Mock;
      const mockInsert = db.insert as jest.Mock;
      mockDbUpdate.mockReturnValue({
        set: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
      });
      mockDbDelete.mockReturnValue({
        where: jest.fn().mockReturnThis(),
      });
      mockInsert.mockImplementationOnce(() => ({
        values: jest.fn().mockReturnThis(),
        returning: jest.fn().mockResolvedValueOnce([{ id: 10 }]),
      }));
      mockInsert.mockImplementationOnce(() => ({
        values: jest.fn().mockReturnThis(),
      }));
      const mockPhotoData = ['data:image/jpeg;base64,newphoto'];
      const mockFormData = {
        title: 'Updated Listing',
        price: 150,
        description: undefined,
        longDescription: undefined,
        categoryId: null,
        status: 'Draft' as const,
        sellerId: 1,
      };
      const result = await updateListing(2, mockFormData, mockPhotoData);
      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledWith(listingPhotos);
      expect(db.insert).toHaveBeenCalledWith(photos);
      expect(db.insert).toHaveBeenCalledWith(listingPhotos);
    });

    test('should return error on validation failure', async () => {
      const mockFormData = {
        title: '',
        price: 0,
        status: 'Draft' as const,
        sellerId: 1,
      };
      const result = await updateListing(1, mockFormData, []);
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy();
    });
  });

  describe('deleteListing', () => {
    test('should delete listing successfully', async () => {
      const mockDbDelete = db.delete as jest.Mock;
      mockDbDelete.mockReturnValueOnce({
        where: jest.fn().mockReturnThis(),
      });
      const result = await deleteListing(1);
      expect(result).toEqual({ success: true });
      expect(db.delete).toHaveBeenCalledWith(listings);
      expect(revalidatePath).toHaveBeenCalledWith('/');
    });

    test('should not return sold listings', async () => {
      const mockDbDelete = db.delete as jest.Mock;
      mockDbDelete.mockImplementationOnce(() => {
        throw new Error('Delete failed');
      });
      const result = await deleteListing(2);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete listing');
    });
  });
});
