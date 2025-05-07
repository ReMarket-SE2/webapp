import { renderHook, act } from '@testing-library/react';
import { toast } from 'sonner';
import { useWishlist } from '@/lib/hooks/use-wishlist';
import * as actions from '@/lib/wishlist/actions';

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/wishlist/actions', () => ({
  getWishlistListingsByUserId: jest.fn(),
  addListingToWishlist: jest.fn(),
  removeListingFromWishlist: jest.fn(),
  clearWishlist: jest.fn(),
}));

describe('useWishlist', () => {
  const userId = 1;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch wishlist items on initialization', async () => {
    const mockListings = [{ id: 1, title: 'Listing 1' }];
    (actions.getWishlistListingsByUserId as jest.Mock).mockResolvedValue(mockListings);

    const { result } = renderHook(() => useWishlist(userId));

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(actions.getWishlistListingsByUserId).toHaveBeenCalledWith(userId);
    expect(result.current.wishlist).toEqual(mockListings);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(false);
  });

  it('should handle errors during wishlist fetch', async () => {
    (actions.getWishlistListingsByUserId as jest.Mock).mockRejectedValue(new Error('Fetch error'));

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      // Wait for the fetch to complete
    });

    expect(actions.getWishlistListingsByUserId).toHaveBeenCalledWith(userId);
    expect(result.current.wishlist).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasError).toBe(true);
    expect(toast.error).toHaveBeenCalledWith('Failed to fetch wishlist');
  });

  it('should add a listing to the wishlist', async () => {
    const listingId = 2;
    (actions.addListingToWishlist as jest.Mock).mockResolvedValue(undefined);
    (actions.getWishlistListingsByUserId as jest.Mock).mockResolvedValue([{ id: listingId, title: 'Listing 2' }]);

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.addToWishlist(listingId);
    });

    expect(actions.addListingToWishlist).toHaveBeenCalledWith(userId, listingId);
    expect(actions.getWishlistListingsByUserId).toHaveBeenCalledWith(userId);
    expect(result.current.wishlist).toEqual([{ id: listingId, title: 'Listing 2' }]);
    expect(toast.success).toHaveBeenCalledWith('Added to wishlist');
  });

  it('should handle errors when adding a listing to the wishlist', async () => {
    const listingId = 2;
    (actions.addListingToWishlist as jest.Mock).mockRejectedValue(new Error('Add error'));

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.addToWishlist(listingId);
    });

    expect(actions.addListingToWishlist).toHaveBeenCalledWith(userId, listingId);
    expect(toast.error).toHaveBeenCalledWith('Failed to add to wishlist');
  });

  it('should remove a listing from the wishlist', async () => {
    const listingId = 1;
    (actions.removeListingFromWishlist as jest.Mock).mockResolvedValue(undefined);
    (actions.getWishlistListingsByUserId as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.removeFromWishlist(listingId);
    });

    expect(actions.removeListingFromWishlist).toHaveBeenCalledWith(userId, listingId);
    expect(actions.getWishlistListingsByUserId).toHaveBeenCalledWith(userId);
    expect(result.current.wishlist).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith('Removed from wishlist');
  });

  it('should handle errors when removing a listing from the wishlist', async () => {
    const listingId = 1;
    (actions.removeListingFromWishlist as jest.Mock).mockRejectedValue(new Error('Remove error'));

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.removeFromWishlist(listingId);
    });

    expect(actions.removeListingFromWishlist).toHaveBeenCalledWith(userId, listingId);
    expect(toast.error).toHaveBeenCalledWith('Failed to remove from wishlist');
  });

  it('should clear the wishlist', async () => {
    (actions.clearWishlist as jest.Mock).mockResolvedValue(undefined);
    (actions.getWishlistListingsByUserId as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.clearUserWishlist();
    });

    expect(actions.clearWishlist).toHaveBeenCalledWith(userId);
    expect(actions.getWishlistListingsByUserId).toHaveBeenCalledWith(userId);
    expect(result.current.wishlist).toEqual([]);
    expect(toast.success).toHaveBeenCalledWith('Wishlist cleared');
  });

  it('should handle errors when clearing the wishlist', async () => {
    (actions.clearWishlist as jest.Mock).mockRejectedValue(new Error('Clear error'));

    const { result } = renderHook(() => useWishlist(userId));

    await act(async () => {
      await result.current.clearUserWishlist();
    });

    expect(actions.clearWishlist).toHaveBeenCalledWith(userId);
    expect(toast.error).toHaveBeenCalledWith('Failed to clear wishlist');
  });
});
