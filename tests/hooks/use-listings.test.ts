import { renderHook, act, waitFor } from '@testing-library/react';
import { useListings } from '@/lib/hooks/use-listings';
import { getAllListings } from '@/lib/listings/actions';

// Mock the getAllListings action
jest.mock('@/lib/listings/actions', () => ({
  getAllListings: jest.fn(),
}));

describe('useListings', () => {
  const mockListings = [
    {
      id: 1,
      title: 'Listing 1',
      price: '100',
      category: 'Category A',
      photo: 'photo1',
      createdAt: new Date(),
    },
    {
      id: 2,
      title: 'Listing 2',
      price: '200',
      category: 'Category B',
      photo: 'photo2',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should fetch listings on mount and update state', async () => {
    (getAllListings as jest.Mock).mockResolvedValueOnce({
      listings: mockListings,
      totalCount: 5,
    });

    const { result } = renderHook(() => useListings());

    // Initially loading should be true
    expect(result.current.loading).toBe(true);

    // Wait for the hook to finish fetching
    await waitFor(() => expect(result.current.loading).toBe(false));

    // State should be updated correctly
    expect(result.current.listings).toEqual(mockListings);
    expect(result.current.metadata).toEqual({
      totalCount: 5,
      totalPages: 1, // ceil(5 / 20)
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(getAllListings).toHaveBeenCalledTimes(1);
    expect(getAllListings).toHaveBeenCalledWith(expect.objectContaining({ page: 1, pageSize: 20 }));
  });

  test('should update options and refetch listings', async () => {
    const firstResponse = { listings: mockListings, totalCount: 5 };
    const secondResponse = {
      listings: [mockListings[0]],
      totalCount: 5,
    };

    (getAllListings as jest.Mock)
      .mockResolvedValueOnce(firstResponse)
      .mockResolvedValueOnce(secondResponse);

    const { result } = renderHook(() => useListings());

    // Wait for the first fetch
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Update options (e.g., move to page 2 with pageSize 2)
    act(() => {
      result.current.updateOptions({ page: 2, pageSize: 2 });
    });

    // Loading should become true immediately after updating options
    expect(result.current.loading).toBe(true);

    // Wait for the second fetch
    await waitFor(() => expect(result.current.loading).toBe(false));

    // Verify that listings and metadata were updated
    expect(result.current.listings).toEqual([mockListings[0]]);
    expect(result.current.metadata).toEqual({
      totalCount: 5,
      totalPages: 3, // ceil(5 / 2)
      hasNextPage: true, // page 2 < 3
      hasPreviousPage: true, // page 2 > 1
    });

    // Ensure getAllListings was called with updated options
    expect(getAllListings).toHaveBeenCalledTimes(2);
    expect(getAllListings).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 2 })
    );
  });

  test('should handle errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    (getAllListings as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useListings());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.listings).toEqual([]);
    expect(result.current.metadata).toEqual({
      totalCount: 0,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});
