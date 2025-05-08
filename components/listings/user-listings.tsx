"use client";

import { useState } from "react";
import { ListingCard } from "@/components/listings/listing-card";
import { ListingFilters } from "@/components/listings/listing-filters";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { findUserById } from "@/lib/users/actions";
import { ShortListing } from "@/lib/listings/actions";

interface UserListingsProps {
  userId: number;
  initialListings: ShortListing[];
  categories: { id: number; name: string }[];
  totalListings: number;
}

export function UserListings({ userId, initialListings, categories, totalListings }: UserListingsProps) {
  const [listings, setListings] = useState(initialListings);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentCategoryId, setCurrentCategoryId] = useState<number | null>(null);
  const [currentSortOrder, setCurrentSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isLoading, setIsLoading] = useState(false);

  const totalPages = Math.ceil(totalListings / 10);

  const fetchListings = async (page: number, categoryId: number | null, sortOrder: 'asc' | 'desc') => {
    setIsLoading(true);
    try {
      const user = await findUserById(userId, {
        page,
        pageSize: 10,
        sortOrder,
        categoryId,
      });
      if (user) {
        setListings(user.activeListings);
        setCurrentPage(page);
        setCurrentCategoryId(categoryId);
        setCurrentSortOrder(sortOrder);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (categoryId: number | null) => {
    fetchListings(1, categoryId, currentSortOrder);
  };

  const handleSortOrderChange = (sortOrder: 'asc' | 'desc') => {
    fetchListings(1, currentCategoryId, sortOrder);
  };

  const handlePageChange = (e: React.MouseEvent, page: number) => {
    e.preventDefault();
    fetchListings(page, currentCategoryId, currentSortOrder);
  };

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Active Listings</h2>
        <ListingFilters
          categories={categories}
          currentCategoryId={currentCategoryId}
          currentSortOrder={currentSortOrder}
          onCategoryChange={handleCategoryChange}
          onSortOrderChange={handleSortOrderChange}
        />
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="text-center py-4">Loading...</div>
        ) : (
          listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.max(1, currentPage - 1))}
                  className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <PaginationItem key={pageNum}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => handlePageChange(e, pageNum)}
                    isActive={pageNum === currentPage}
                    className="cursor-pointer"
                  >
                    {pageNum}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  href="#"
                  onClick={(e) => handlePageChange(e, Math.min(totalPages, currentPage + 1))}
                  className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
} 