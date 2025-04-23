'use client';

import { useState, useEffect } from 'react';
import { getAllListings, ShortListing } from '@/lib/listings/actions';

export interface UseListingsOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'date';
  sortOrder?: 'asc' | 'desc'; // asc for low-to-high or oldest-first, desc for high-to-low or newest-first
  categoryId?: number | null;
  // Future filters can be added here, e.g., categoryId, minPrice, maxPrice
}

export interface ListingsPaginationMetadata {
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ListingsResponse {
  listings: ShortListing[];
  totalCount: number;
}

export function useListings(initialOptions: UseListingsOptions = {}) {
  const [listings, setListings] = useState<ShortListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<UseListingsOptions>({
    page: 1,
    pageSize: 20,
    categoryId: null,
    ...initialOptions,
  });
  const [metadata, setMetadata] = useState<ListingsPaginationMetadata>({
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const data = (await getAllListings(options)) as ListingsResponse;
        setListings(data.listings);
        setMetadata({
          totalCount: data.totalCount,
          totalPages: Math.ceil(data.totalCount / (options.pageSize || 20)),
          hasNextPage: (options.page || 1) < Math.ceil(data.totalCount / (options.pageSize || 20)),
          hasPreviousPage: (options.page || 1) > 1,
        });
      } catch (error) {
        console.error('Error fetching listings:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchListings();
  }, [options]);

  // Function to update options (e.g., for pagination or sorting)
  function updateOptions(newOptions: Partial<UseListingsOptions>) {
    setOptions(prevOptions => ({ ...prevOptions, ...newOptions }));
  }

  return { listings, loading, options, metadata, updateOptions };
}
