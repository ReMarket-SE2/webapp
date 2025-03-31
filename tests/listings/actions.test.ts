import { createListing, getListingById } from '@/lib/listings/actions';
import { db } from '@/lib/db';
import { listings } from '@/lib/db/schema/listings';
import { photos } from '@/lib/db/schema/photos';
import { listingPhotos } from '@/lib/db/schema/listing_photos';
import { revalidatePath } from 'next/cache';
import { eq, inArray } from 'drizzle-orm';

// Mock the database and revalidatePath
jest.mock('@/lib/db', () => {
  // Create a chain-able mock for db operations
  const mockInsertChain = {
    values: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  const mockDb = {
    insert: jest.fn(() => mockInsertChain),
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
  };

  return { db: mockDb };
});

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}));

jest.mock('drizzle-orm', () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
}));

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
      };

      const result = await createListing(listingData, []);

      // Verify the results
      expect(result.success).toBe(false);
      expect(result.error).toBeTruthy(); // Should have some error message
    });
  });

  describe('getListingById', () => {
    test('should retrieve a listing by ID', async () => {
      const mockListing = {
        id: 123,
        title: 'Test Listing',
        price: '100',
        description: 'Test Description',
        longDescription: 'Detailed test description',
        categoryId: null,
        status: 'Active',
      };

      // Configure mocks for successful listing retrieval
      const mockDbSelect = db.select as jest.Mock;

      // First call for listing
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListing]),
      }));

      // Second call for photo IDs
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([{ photoId: 1 }, { photoId: 2 }]),
      }));

      // Third call for photo data
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([
          { id: 1, image: 'data:image/jpeg;base64,photo1' },
          { id: 2, image: 'data:image/jpeg;base64,photo2' },
        ]),
      }));

      const result = await getListingById(123);

      // Verify the results
      expect(result).toEqual({
        ...mockListing,
        photos: ['data:image/jpeg;base64,photo1', 'data:image/jpeg;base64,photo2'],
      });

      // Verify the database was queried correctly
      expect(eq).toHaveBeenCalled();
      expect(inArray).toHaveBeenCalled();
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

    test('should handle database errors', async () => {
      // Configure mock to throw an error
      const mockDbSelect = db.select as jest.Mock;
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValueOnce(new Error('Database error')),
      }));

      const result = await getListingById(123);

      // Verify the results
      expect(result).toBeNull();
    });

    test('should fetch a listing without photos', async () => {
      const mockListing = {
        id: 123,
        title: 'Test Listing',
        price: '100',
        description: 'Test Description',
        longDescription: null,
        categoryId: null,
        status: 'Active',
      };

      // Configure mocks for successful listing retrieval with no photos
      const mockDbSelect = db.select as jest.Mock;

      // First call for listing
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([mockListing]),
      }));

      // Second call for photo IDs (empty)
      mockDbSelect.mockImplementationOnce(() => ({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockResolvedValueOnce([]),
      }));

      const result = await getListingById(123);

      // Verify the results
      expect(result).toEqual({
        ...mockListing,
        photos: [],
      });
    });
  });
});
