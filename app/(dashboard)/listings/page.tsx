import { getCategories } from '@/lib/categories/actions';
import React from 'react';
import { getAllListings } from '@/lib/listings/actions';
import { ListingsPageClient } from './page-client';

export default async function ListingsPage({ searchParams }: { searchParams: Promise<{ category?: string; search?: string; sort?: string }> }) {
  const params = await searchParams;
  const categories = await getCategories();
  const selectedCategoryId = params.category ? Number(params.category) : null;
  const search = params.search || '';
  const sortOrder = params.sort === 'asc' ? 'asc' : 'desc';
  const { listings } = await getAllListings({ categoryId: selectedCategoryId ?? undefined, searchTerm: search, sortOrder });
  return (
    <ListingsPageClient
      categories={categories}
      initialCategoryId={selectedCategoryId}
      initialSearch={search}
      initialSortOrder={sortOrder}
      listings={listings}
    />
  );
}
