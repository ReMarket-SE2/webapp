"use client";

import { useListingsContext } from "@/components/contexts/listings-context";
import { ListingCard } from '@/components/listings/listing-card';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
};

export default function ListingsPage() {
  const { listings, loading } = useListingsContext();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900">No listings found 🫠</h3>
          <p className="mt-1 text-sm text-gray-500">Be the first to create a listing!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col gap-4 p-4 pb-20">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex-1 grid grid-cols-1 lg:grid-cols-2 auto-rows-max gap-2"
      >
        {listings.map(listing => (
          <motion.div key={listing.id} variants={item}>
            <ListingCard listing={listing} />
          </motion.div>
        ))}
      </motion.div>
    </div >
  );
}
