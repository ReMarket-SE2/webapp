"use client";

import { createContext, useContext, ReactNode } from 'react';
import { UseListingsOptions, useListings, ListingsPaginationMetadata } from './use-listings';
import { ShortListing } from '@/lib/listings/actions';

interface ListingsContextType {
  listings: ShortListing[];
  loading: boolean;
  options: UseListingsOptions;
  metadata: ListingsPaginationMetadata;
  updateOptions: (newOptions: Partial<UseListingsOptions>) => void;
}

const ListingsContext = createContext<ListingsContextType | undefined>(undefined);

export function ListingsProvider({ children, initialOptions = {} }: { children: ReactNode, initialOptions?: UseListingsOptions }) {
  const listingsData = useListings(initialOptions);

  return (
    <ListingsContext.Provider value={listingsData}>
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