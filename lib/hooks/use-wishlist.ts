'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  getWishlistListingsByUserId,
  addListingToWishlist,
  removeListingFromWishlist,
  clearWishlist,
} from '@/lib/wishlist/actions';

export interface WishlistItem {
  id: number;
  title: string;
}

export interface UseWishlistReturn {
  wishlist: WishlistItem[];
  isLoading: boolean;
  hasError: boolean;
  addToWishlist: (listingId: number) => Promise<void>;
  removeFromWishlist: (listingId: number) => Promise<void>;
  clearUserWishlist: () => Promise<void>;
}

export function useWishlist(userId: number | null): UseWishlistReturn {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const fetchWishlist = useCallback(async () => {
    if (!userId) return; // Do nothing if userId is not provided
    setIsLoading(true);
    setHasError(false);
    try {
      const listings = await getWishlistListingsByUserId(userId);
      setWishlist(listings);
    } catch (error) {
      setHasError(true);
      toast.error('Failed to fetch wishlist');
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const addToWishlist = useCallback(
    async (listingId: number) => {
      if (!userId) return; // Do nothing if userId is not provided
      try {
        await addListingToWishlist(userId, listingId);
        toast.success('Added to wishlist');
        fetchWishlist();
      } catch (error) {
        toast.error('Failed to add to wishlist');
        console.error('Error adding to wishlist:', error);
      }
    },
    [userId, fetchWishlist]
  );

  const removeFromWishlist = useCallback(
    async (listingId: number) => {
      if (!userId) return; // Do nothing if userId is not provided
      try {
        await removeListingFromWishlist(userId, listingId);
        toast.success('Removed from wishlist');
        fetchWishlist();
      } catch (error) {
        toast.error('Failed to remove from wishlist');
        console.error('Error removing from wishlist:', error);
      }
    },
    [userId, fetchWishlist]
  );

  const clearUserWishlist = useCallback(async () => {
    if (!userId) return; // Do nothing if userId is not provided
    try {
      await clearWishlist(userId);
      toast.success('Wishlist cleared');
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to clear wishlist');
      console.error('Error clearing wishlist:', error);
    }
  }, [userId, fetchWishlist]);

  useEffect(() => {
    if (userId) fetchWishlist(); // Only fetch if userId is provided
  }, [fetchWishlist, userId]);

  return {
    wishlist,
    isLoading,
    hasError,
    addToWishlist,
    removeFromWishlist,
    clearUserWishlist,
  };
}
