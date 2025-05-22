import React from 'react';
// import { getCategories } from '@/lib/categories/actions'; // Handled by ListingsContext
// import { getAllListings } from '@/lib/listings/actions'; // Handled by ListingsContext via useListings hook
import { ListingsPageClient } from './page-client';

// Reverted searchParams type to Promise as indicated by runtime errors
export default async function ListingsPage({ searchParams }: {
  searchParams: Promise<{ // Type is a Promise
    category?: string;
    search?: string;
    sort?: string;
    page?: string;
  }>
}) {
  const params = await searchParams; // Await the searchParams Promise

  const selectedCategoryId = params.category ? Number(params.category) : null;
  const search = params.search || '';
  const sortOrder = params.sort === 'asc' ? 'asc' : 'desc';
  // The initial page from URL will be handled by the context synchronization if needed,
  // or by the pagination component setting it. For filter-related props, we pass these:

  return (
    <ListingsPageClient
      initialCategoryId={selectedCategoryId}
      initialSearch={search}
      initialSortOrder={sortOrder}
    // listings prop is removed as client will use context
    // categories prop was already removed
    />
  );
}
