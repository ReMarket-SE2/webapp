"use client";
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { ListingsGrid } from '@/components/listings/listings-grid';
import { ListingFilters } from '@/components/listings/listing-filters';
import { Category } from '@/lib/db/schema/categories';
import { ShortListing } from '@/lib/listings/actions';

interface ListingsPageClientProps {
  categories: Category[];
  initialCategoryId: number | null;
  initialSearch: string;
  initialSortOrder: 'asc' | 'desc';
  listings: ShortListing[];
}

export function ListingsPageClient({ categories, initialCategoryId, initialSearch, initialSortOrder, listings }: ListingsPageClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const getFilterUrl = useCallback((categoryId: number | null, search: string, sortOrder: 'asc' | 'desc') => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (categoryId) params.set('category', String(categoryId)); else params.delete('category');
    if (search) params.set('search', search); else params.delete('search');
    if (sortOrder && sortOrder !== 'desc') params.set('sort', sortOrder); else params.delete('sort');
    return `${pathname}?${params.toString()}`;
  }, [pathname, searchParams]);

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 pb-20">
      <ListingFilters
        categories={categories}
        currentCategoryId={initialCategoryId}
        currentSortOrder={initialSortOrder}
        currentSearch={initialSearch}
        onCategoryChange={categoryId => router.push(getFilterUrl(categoryId, initialSearch, initialSortOrder))}
        onSortOrderChange={sortOrder => router.push(getFilterUrl(initialCategoryId, initialSearch, sortOrder))}
        onSearchChange={search => router.push(getFilterUrl(initialCategoryId, search, initialSortOrder))}
      />
      <ListingsGrid categories={categories} listings={listings} />
    </div>
  );
}
