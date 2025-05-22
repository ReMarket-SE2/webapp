"use client";
// import { useRouter, useSearchParams, usePathname } from 'next/navigation'; // No longer needed
// import { useCallback } from 'react'; // No longer needed
import { useEffect } from 'react'; // Added useEffect
import { ListingsGrid } from '@/components/listings/listings-grid';
// import { ListingFilters } from '@/components/listings/listing-filters'; // Removed
// import { Category } from '@/lib/db/schema/categories'; // No longer needed
// import { ShortListing } from '@/lib/listings/actions'; // No longer needed, will come from context
import { useListingsContext } from '@/components/contexts/listings-context'; // Import context

interface ListingsPageClientProps {
  // categories: Category[]; // This prop is no longer strictly needed here if filters are global
  initialCategoryId: number | null;
  initialSearch: string;
  initialSortOrder: 'asc' | 'desc';
  // listings: ShortListing[]; // Removed: listings will come from context
}

export function ListingsPageClient({ /* categories, */ initialCategoryId, initialSearch, initialSortOrder }: ListingsPageClientProps) {
  const { listings, options, updateOptions } = useListingsContext(); // Get listings and options from context

  useEffect(() => {
    const contextChanged =
      initialCategoryId !== (options.categoryId ?? null) ||
      initialSearch !== (options.searchTerm ?? '') ||
      initialSortOrder !== (options.sortOrder ?? 'desc');

    if (contextChanged) {
      updateOptions({
        categoryId: initialCategoryId ?? undefined,
        searchTerm: initialSearch,
        sortOrder: initialSortOrder,
        page: options.page || 1 // Preserve current page or default to 1
      });
    }
    // We only want to run this on mount to sync initial URL params to context
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs only once on mount

  // const router = useRouter(); // No longer needed if filters are global and use context
  // const pathname = usePathname(); // No longer needed
  // const searchParams = useSearchParams(); // No longer needed

  // const getFilterUrl = useCallback((categoryId: number | null, search: string, sortOrder: 'asc' | 'desc') => { // No longer needed
  //   const params = new URLSearchParams(searchParams?.toString() || '');
  //   if (categoryId) params.set('category', String(categoryId)); else params.delete('category');
  //   if (search) params.set('search', search); else params.delete('search');
  //   if (sortOrder && sortOrder !== 'desc') params.set('sort', sortOrder); else params.delete('sort');
  //   return `${pathname}?${params.toString()}`;
  // }, [pathname, searchParams]);

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 pb-20">
      {/* <ListingFilters // Removed
        categories={categories}
        currentCategoryId={initialCategoryId}
        currentSortOrder={initialSortOrder}
        currentSearch={initialSearch}
        onCategoryChange={categoryId => router.push(getFilterUrl(categoryId, initialSearch, initialSortOrder))}
        onSortOrderChange={sortOrder => router.push(getFilterUrl(initialCategoryId, initialSearch, sortOrder))}
        onSearchChange={search => router.push(getFilterUrl(initialCategoryId, search, initialSortOrder))}
      /> */}
      <ListingsGrid /* categories={categories} */ listings={listings} />
    </div>
  );
}
