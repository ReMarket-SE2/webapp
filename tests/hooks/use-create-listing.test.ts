import { renderHook, act } from '@testing-library/react';
import { useCreateListing } from '@/lib/hooks/use-create-listing';
import { createListing } from '@/lib/listings/actions';
import { toast } from 'sonner';

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

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock URL.createObjectURL and URL.revokeObjectURL
const mockObjectUrl = 'mock-object-url';
global.URL.createObjectURL = jest.fn(() => mockObjectUrl);
global.URL.revokeObjectURL = jest.fn();

// Mock crypto.randomUUID
const mockUUID = '123e4567-e89b-12d3-a456-426614174000';
global.crypto = {
  ...global.crypto,
  randomUUID: jest.fn(() => mockUUID),
} as any;

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

    expect(result.current.form).toEqual({
      ...result.current.form,
      title: 'Test Title',
      price: 100,
    });
  });

  test('should add a photo', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(1);
    expect(result.current.photoFiles[0]).toEqual({
      id: expect.any(String),
      file,
      previewUrl: mockObjectUrl,
    });
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  test('should not add a non-image file', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Only image files are allowed');
  });

  test('should remove a photo', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
    });

    const photoId = result.current.photoFiles[0].id;

    act(() => {
      result.current.removePhoto(photoId);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });

  test('should reset form and photos', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.updateForm({ title: 'Test', price: 100 });
      result.current.addPhoto(file);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.form).toEqual({
      title: '',
      price: 0,
      description: '',
      longDescription: '',
      categoryId: null,
      status: 'Draft',
    });
    expect(result.current.photoFiles).toHaveLength(0);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(mockObjectUrl);
  });

  test('should show error when saving without title', async () => {
    const { result } = renderHook(() => useCreateListing());

    const listingId = await act(async () => {
      return await result.current.saveListing();
    });

    expect(listingId).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Title is required');
    expect(createListing).not.toHaveBeenCalled();
  });

  test('should show error when saving with price <= 0', async () => {
    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.updateForm({ title: 'Test Title', price: 0 });
    });

    const listingId = await act(async () => {
      return await result.current.saveListing();
    });

    expect(listingId).toBeNull();
    expect(toast.error).toHaveBeenCalledWith('Price must be greater than 0');
    expect(createListing).not.toHaveBeenCalled();
  });

  test('should save listing successfully', async () => {
    const mockListingId = 123;
    (createListing as jest.Mock).mockResolvedValue({
      success: true,
      listingId: mockListingId,
    });

    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.updateForm({
        title: 'Test Title',
        price: 100,
        description: 'Test description',
        longDescription: 'Test long description',
        categoryId: 1,
      });
      result.current.addPhoto(file);
    });

    // Mock FileReader for base64 conversion
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as any,
      result: 'data:image/jpeg;base64,test',
    };
    global.FileReader = jest.fn(() => mockFileReader) as any;

    const listingId = await act(async () => {
      const promise = result.current.saveListing();
      mockFileReader.onload?.();
      return await promise;
    });

    expect(listingId).toBe(mockListingId);
    expect(createListing).toHaveBeenCalledWith(
      {
        title: 'Test Title',
        price: 100,
        description: 'Test description',
        longDescription: 'Test long description',
        categoryId: 1,
        status: 'Draft',
      },
      ['data:image/jpeg;base64,test']
    );
    expect(toast.success).toHaveBeenCalledWith('Listing saved successfully');
  });

  test('should handle createListing error', async () => {
    const errorMessage = 'Failed to create listing';
    (createListing as jest.Mock).mockResolvedValue({
      success: false,
      error: errorMessage,
    });

    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.updateForm({
        title: 'Test Title',
        price: 100,
      });
    });

    const listingId = await act(async () => {
      return await result.current.saveListing();
    });

    expect(listingId).toBeNull();
    expect(toast.error).toHaveBeenCalledWith(errorMessage);
  });

  test('should save as draft', async () => {
    const mockListingId = 123;
    (createListing as jest.Mock).mockResolvedValue({
      success: true,
      listingId: mockListingId,
    });

    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.updateForm({
        title: 'Test Title',
        price: 100,
      });
    });

    const listingId = await act(async () => {
      return await result.current.saveListingAsDraft();
    });

    expect(listingId).toBe(mockListingId);
    expect(createListing).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Draft',
      }),
      []
    );
  });

  test('should publish listing', async () => {
    const mockListingId = 123;
    (createListing as jest.Mock).mockResolvedValue({
      success: true,
      listingId: mockListingId,
    });

    const { result } = renderHook(() => useCreateListing());

    act(() => {
      result.current.updateForm({
        title: 'Test Title',
        price: 100,
      });
    });

    const listingId = await act(async () => {
      return await result.current.publishListing();
    });

    expect(listingId).toBe(mockListingId);
    expect(createListing).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'Active',
      }),
      []
    );
  });

  test('should handle file to base64 conversion error', async () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.updateForm({
        title: 'Test Title',
        price: 100,
      });
      result.current.addPhoto(file);
    });

    // Mock FileReader to simulate error
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onerror: null as any,
    };
    global.FileReader = jest.fn(() => mockFileReader) as any;

    // Mock createListing to return error
    (createListing as jest.Mock).mockResolvedValue({
      success: false,
      error: 'Failed to save listing',
    });

    const listingId = await act(async () => {
      const promise = result.current.saveListing();
      mockFileReader.onerror?.('Test error');
      return await promise;
    });

    expect(listingId).toBe(null);
    expect(toast.error).toHaveBeenCalledWith('Failed to save listing');
  });

  test('should enforce long description character limit', () => {
    const { result } = renderHook(() => useCreateListing());
    const longDescription = 'a'.repeat(2001); // One character over limit

    act(() => {
      result.current.updateForm({ longDescription });
    });

    expect(result.current.form.longDescription).toBe('');
    expect(toast.error).toHaveBeenCalledWith('Detailed description cannot exceed 2000 characters');
  });

  test('should enforce photo limit', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Add 10 photos
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.addPhoto(file);
      });
    }

    // Try to add one more
    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(10);
    expect(toast.error).toHaveBeenCalledWith('You can only upload up to 10 photos');
  });

  test('should handle non-image file upload attempt', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Only image files are allowed');
  });

  test('should handle file upload with invalid file type', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test', { type: '' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Only image files are allowed');
  });

  test('should handle file upload with unsupported image type', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.tiff', { type: 'image/tiff' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  test('should update form with valid long description', () => {
    const { result } = renderHook(() => useCreateListing());
    const validDescription = 'a'.repeat(2000); // At limit

    act(() => {
      result.current.updateForm({ longDescription: validDescription });
    });

    expect(result.current.form.longDescription).toBe(validDescription);
    expect(toast.error).not.toHaveBeenCalled();
  });

  test('should handle empty file list in addPhoto', () => {
    const { result } = renderHook(() => useCreateListing());
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(emptyFile);
    });

    expect(result.current.photoFiles).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(emptyFile);
  });

  test('should handle removing non-existent photo', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
      result.current.removePhoto('non-existent-id');
    });

    expect(result.current.photoFiles).toHaveLength(1);
  });

  test('should handle file upload with unsupported file type', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    // Mock URL.createObjectURL to prevent it from being called
    const originalCreateObjectURL = URL.createObjectURL;
    URL.createObjectURL = jest.fn();

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Only image files are allowed');

    // Restore the original function
    URL.createObjectURL = originalCreateObjectURL;
  });

  test('should handle file upload with empty file type', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test', { type: '' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith('Only image files are allowed');
  });

  test('should accept file upload with supported image type', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
    });

    expect(result.current.photoFiles).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  });

  test('should handle empty file list in addPhoto', () => {
    const { result } = renderHook(() => useCreateListing());
    const emptyFile = new File([], 'empty.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(emptyFile);
    });

    expect(result.current.photoFiles).toHaveLength(1);
    expect(URL.createObjectURL).toHaveBeenCalledWith(emptyFile);
  });

  test('should handle removing non-existent photo', () => {
    const { result } = renderHook(() => useCreateListing());
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    act(() => {
      result.current.addPhoto(file);
      result.current.removePhoto('non-existent-id');
    });

    expect(result.current.photoFiles).toHaveLength(1);
  });
});
