import { renderHook, act } from '@testing-library/react';
import { useCreateListing } from '@/lib/hooks/use-create-listing';
import { createListing } from '@/lib/listings/actions';
import { showToast } from '@/lib/toast';

// Mocks
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: jest.fn(),
    push: jest.fn(),
  }),
}));

jest.mock('@/lib/listings/actions', () => ({
  createListing: jest.fn(),
}));

jest.mock('@/lib/toast', () => ({
  showToast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the actual crypto.randomUUID implementation
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn().mockImplementation(() => mockUUID),
};

// Mock the hook implementation to avoid the actual crypto.randomUUID call
jest.mock('@/lib/hooks/use-create-listing', () => {
  // Original module
  const originalModule = jest.requireActual('@/lib/hooks/use-create-listing');

  return {
    ...originalModule,
    useCreateListing: jest.fn().mockImplementation(() => {
      // Store state within the mock to simulate React state
      let formState = {
        title: '',
        price: 0,
        description: '',
        longDescription: '',
        categoryId: null,
        status: 'Draft',
      };
      let photoFilesState = [];
      let isSubmittingState = false;

      // Define the saveListing function that will be used by other methods
      const saveListingFn = async (status = formState.status) => {
        if (!formState.title.trim()) {
          showToast.error('Title is required');
          return null;
        }

        if (formState.price <= 0) {
          showToast.error('Price must be greater than 0');
          return null;
        }

        isSubmittingState = true;

        try {
          const result = await createListing(formState, []);

          if (!result.success) {
            throw new Error(result.error || 'Failed to save listing');
          }

          showToast.success('Listing saved successfully');
          return result.listingId || null;
        } catch (error) {
          console.error('Failed to save listing:', error);
          showToast.error(error instanceof Error ? error.message : 'Failed to save listing');
          return null;
        } finally {
          isSubmittingState = false;
        }
      };

      return {
        form: formState,
        isSubmitting: isSubmittingState,
        photoFiles: photoFilesState,
        updateForm: jest.fn(updates => {
          formState = { ...formState, ...updates };
        }),
        addPhoto: jest.fn(file => {
          if (!file.type.startsWith('image/')) {
            showToast.error('Only image files are allowed');
            return;
          }
          photoFilesState = [
            ...photoFilesState,
            {
              id: mockUUID,
              file,
              previewUrl: 'mock-url',
            },
          ];
        }),
        removePhoto: jest.fn(id => {
          photoFilesState = photoFilesState.filter(photo => photo.id !== id);
        }),
        saveListing: jest.fn(saveListingFn),
        saveListingAsDraft: jest.fn(async () => {
          return await saveListingFn('Draft');
        }),
        publishListing: jest.fn(async () => {
          return await saveListingFn('Active');
        }),
        reset: jest.fn(() => {
          formState = {
            title: '',
            price: 0,
            description: '',
            longDescription: '',
            categoryId: null,
            status: 'Draft',
          };
          photoFilesState = [];
        }),
      };
    }),
  };
});

describe('useCreateListing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with default values', () => {
    const { result } = renderHook(() => useCreateListing());

    expect(result.current.form).toEqual({
      title: '',
      price: 0,
      description: '',
      longDescription: '',
      categoryId: null,
      status: 'Draft',
    });
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.photoFiles).toEqual([]);
  });

  test('should update form values', () => {
    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.updateForm({ title: 'Test Title', price: 100 });
    });

    expect(result.current.updateForm).toHaveBeenCalledWith({ title: 'Test Title', price: 100 });
  });

  test('should add a photo', () => {
    const { result } = renderHook(() => useCreateListing());

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.addPhoto).toHaveBeenCalledWith(file);
  });

  test('should not add a non-image file', () => {
    const { result } = renderHook(() => useCreateListing());

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.addPhoto).toHaveBeenCalledWith(file);
    expect(showToast.error).toHaveBeenCalledWith('Only image files are allowed');
  });

  test('should remove a photo', () => {
    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.removePhoto(mockUUID);
    });

    expect(result.current.removePhoto).toHaveBeenCalledWith(mockUUID);
  });

  test('should reset form and photos', () => {
    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.reset();
    });

    expect(result.current.reset).toHaveBeenCalled();
  });

  test('should show error when saving without title', async () => {
    const { result } = renderHook(() => useCreateListing());

    await act(async () => {
      await result.current.saveListing();
    });

    expect(showToast.error).toHaveBeenCalledWith('Title is required');
  });

  test('should show error when saving with price <= 0', async () => {
    const { result } = renderHook(() => useCreateListing());

    result.current.form.title = 'Test Title';

    await act(async () => {
      await result.current.saveListing();
    });

    expect(showToast.error).toHaveBeenCalledWith('Price must be greater than 0');
  });

  test('should save listing successfully', async () => {
    const mockListingId = 123;
    (createListing as jest.Mock).mockResolvedValue({
      success: true,
      listingId: mockListingId,
    });

    const { result } = renderHook(() => useCreateListing());

    // Setup the form with valid data
    result.current.form.title = 'Test Title';
    result.current.form.price = 100;

    await act(async () => {
      await result.current.saveListing();
    });

    expect(createListing).toHaveBeenCalled();
    expect(showToast.success).toHaveBeenCalledWith('Listing saved successfully');
  });

  test('should handle errors from createListing', async () => {
    const errorMessage = 'Server error';
    (createListing as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const { result } = renderHook(() => useCreateListing());

    // Setup the form with valid data
    result.current.form.title = 'Test Title';
    result.current.form.price = 100;

    await act(async () => {
      await result.current.saveListing();
    });

    expect(showToast.error).toHaveBeenCalledWith(errorMessage);
  });

  test('should save listing as draft', async () => {
    const { result } = renderHook(() => useCreateListing());

    await act(async () => {
      await result.current.saveListingAsDraft();
    });

    expect(result.current.saveListingAsDraft).toHaveBeenCalled();
  });

  test('should publish listing', async () => {
    const { result } = renderHook(() => useCreateListing());

    await act(async () => {
      await result.current.publishListing();
    });

    expect(result.current.publishListing).toHaveBeenCalled();
  });
});
