"use client";

import { useState, useEffect } from 'react';
import { getAllListings, ShortListing } from '@/lib/listings/actions';

export interface UseListingsOptions {
  page?: number;
  pageSize?: number;
  sortBy?: 'price' | 'date';
  sortOrder?: 'asc' | 'desc'; // asc for low-to-high or oldest-first, desc for high-to-low or newest-first
  // Future filters can be added here, e.g., categoryId, minPrice, maxPrice
}

export function useListings(initialOptions: UseListingsOptions = {}) {
  const [listings, setListings] = useState<ShortListing[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [options, setOptions] = useState<UseListingsOptions>(initialOptions);

  useEffect(() => {
    async function fetchListings() {
      setLoading(true);
      try {
        const data = await getAllListings(options);
        setListings(data);
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

  return { listings, loading, options, updateOptions };
}
