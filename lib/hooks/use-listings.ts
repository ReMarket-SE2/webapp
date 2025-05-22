'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getAllListings, ShortListing } from '@/lib/listings/actions';

export interface UseListingsOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'date';
  sortOrder?: 'asc' | 'desc'; // asc for low-to-high or oldest-first, desc for high-to-low or newest-first
  searchTerm?: string;
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<ShortListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize options from URL search params if available, otherwise use initialOptions or defaults
  const [options, setOptions] = useState<UseListingsOptions>(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    return {
      page: params.get('page') ? parseInt(params.get('page')!, 10) : initialOptions.page || 1,
      pageSize: initialOptions.pageSize || 20,
      sortBy:
        (params.get('sortBy') as 'price' | 'date' | undefined) || initialOptions.sortBy || 'date',
      sortOrder:
        (params.get('sort') as 'asc' | 'desc' | undefined) || initialOptions.sortOrder || 'desc',
      searchTerm: params.get('search') || initialOptions.searchTerm || '',
      categoryId: params.get('category')
        ? parseInt(params.get('category')!, 10)
        : initialOptions.categoryId,
    };
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

  const updateOptions = useCallback((newOptions: Partial<UseListingsOptions>) => {
    setOptions(prevOptions => ({ ...prevOptions, ...newOptions }));
  }, []);

  // Sync URL with options after render
  useEffect(() => {
    const params = new URLSearchParams();

    if (options.page && options.page !== 1) params.set('page', String(options.page));
    if (options.sortOrder && options.sortOrder !== 'desc') params.set('sort', options.sortOrder);
    if (options.searchTerm) params.set('search', options.searchTerm);
    if (options.categoryId) params.set('category', String(options.categoryId));

    const query = params.toString();
    const targetPath = '/listings';
    const url = query ? `${targetPath}?${query}` : targetPath;

    const currentPath = pathname;

    const hasSearch = options.searchTerm?.trim().length ?? 0;

    if (currentPath === targetPath) {
      // Already on /listings → always replace to sync query params
      router.replace(url, { scroll: false });
    } else if (hasSearch) {
      // Only redirect to /listings if user is performing a search
      router.push(url, { scroll: false });
    }
  }, [options, pathname, router]);

  return { listings, loading, options, metadata, updateOptions };
}
