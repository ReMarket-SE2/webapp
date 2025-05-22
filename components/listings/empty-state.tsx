import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  isAdmin?: boolean;
}

export function EmptyState({ isAdmin }: EmptyStateProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center mt-16">
        <h3 className="text-lg font-semibold text-gray-900">No listings found 🫠</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
        {isAdmin && (
          <Button asChild className="mt-4">
            <Link href="/create-listing">Create Listing</Link>
          </Button>
        )}
      </div>
    </div>
  );
} 