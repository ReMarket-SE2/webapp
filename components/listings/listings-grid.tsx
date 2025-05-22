"use client";

import { motion } from "framer-motion";
import { ListingCard } from "@/components/listings/listing-card";
// import { Category } from "@/lib/db/schema/categories"; // No longer needed
import { ShortListing } from "@/lib/listings/actions";
import { useListingsContext } from "../contexts/listings-context"; // Import context

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

interface ListingsGridProps {
  // categories: Category[]; // No longer needed
  listings: ShortListing[];
}

export function ListingsGrid({ listings }: ListingsGridProps) { // Removed categories from props
  const { categories } = useListingsContext(); // Get categories from context
  if (!listings.length)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center mt-16">
          <h3 className="text-lg font-semibold text-gray-900">No listings found 🫠</h3>
          <p className="mt-1 text-sm text-gray-500">Be the first to create a listing!</p>
        </div>
      </div>
    );
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="flex-1 grid grid-cols-1 lg:grid-cols-2 auto-rows-max gap-2"
    >
      {listings.map(listing => (
        <motion.div key={listing.id} variants={item}>
          <ListingCard listing={listing} categories={categories} />
        </motion.div>
      ))}
    </motion.div>
  );
}
