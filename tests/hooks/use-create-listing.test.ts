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
    expect(showToast.error).toHaveBeenCalledWith('Only image files are allowed');
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
    expect(showToast.error).toHaveBeenCalledWith('Title is required');
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
    expect(showToast.error).toHaveBeenCalledWith('Price must be greater than 0');
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
    expect(showToast.success).toHaveBeenCalledWith('Listing saved successfully');
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
    expect(showToast.error).toHaveBeenCalledWith(errorMessage);
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
    expect(showToast.error).toHaveBeenCalledWith('Failed to save listing');
  });
});
