import { getCategories } from '@/lib/categories/actions';
import { CategoryCascadeSelect } from '@/components/listings/category-cascade-select';
import { useListingsContext } from "@/components/contexts/listings-context";
import { ListingCard } from '@/components/listings/listing-card';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Category } from '@/lib/db/schema/categories';
import React from 'react';

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

export default async function ListingsPage() {
  const categories = await getCategories();
  return (
    <div className="flex-1 flex flex-col gap-4 p-4 pb-20">
      <div className="mb-2">
        <CategoryCascadeSelect categories={categories} />
      </div>
      <ListingsGrid categories={categories} />
    </div>
  );
}

interface ListingsGridProps {
  categories: Category[];
}

function ListingsGrid({ categories }: ListingsGridProps) {
  const { listings, loading } = useListingsContext();
  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  if (!listings.length)
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
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
