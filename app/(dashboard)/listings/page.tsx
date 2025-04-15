"use client";

import { useListings } from '@/lib/hooks/use-listings';
import { ListingCard } from '@/components/listings/listing-card';

export default function ListingsPage() {
  const { listings, loading, updateOptions, options } = useListings({
    page: 1,
    pageSize: 20,
    sortBy: 'date',
    sortOrder: 'desc',
  });

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map(listing => (
          <ListingCard key={listing.id} listing={listing} />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        <button
          onClick={() => updateOptions({ page: Math.max(1, options.page! - 1) })}
          disabled={options.page === 1}
          className="px-4 py-2 bg-muted/50 rounded-lg"
        >
          Previous
        </button>
        <button
          onClick={() => updateOptions({ page: (options.page || 1) + 1 })}
          className="px-4 py-2 bg-muted/50 rounded-lg"
        >
          Next
        </button>
      </div>
    </div>
  );
}
