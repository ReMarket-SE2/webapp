"use client";

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { UseListingsOptions, useListings, ListingsPaginationMetadata } from '@/lib/hooks/use-listings';
import { ShortListing } from '@/lib/listings/actions';
import { Category } from '@/lib/db/schema/categories';

interface ListingsContextType {
  listings: ShortListing[];
  loading: boolean;
  options: UseListingsOptions;
  metadata: ListingsPaginationMetadata;
  categories: Category[];
  updateOptions: (newOptions: Partial<UseListingsOptions>) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export function ListingsProvider({ children, initialOptions = {} }: { children: ReactNode, initialOptions?: UseListingsOptions }) {
  const listingsData = useListings(initialOptions);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch('/api/categories');
        if (res.ok) {
          const data: Category[] = await res.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories', error);
      }
    }
    fetchCategories();
  }, []);

  return (
    <ListingsContext.Provider value={{ ...listingsData, categories }}>
      {children}
    </ListingsContext.Provider>
  );
}

export function useListingsContext() {
  const context = useContext(ListingsContext);
  if (context === undefined) {
    throw new Error('useListingsContext must be used within a ListingsProvider');
  }
  return context;
} 