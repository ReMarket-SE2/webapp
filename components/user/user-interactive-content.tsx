"use client";

import { Suspense } from 'react';
import { motion } from 'framer-motion';
import { UserListings } from '@/components/listings/user-listings';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { Skeleton } from '@/components/ui/skeleton';
import { mockReviews } from '@/lib/reviews/mock-data';
import { UserWithListingCounts } from '@/lib/users/actions';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
};

interface UserInteractiveContentProps {
  user: UserWithListingCounts;
  userId: number;
}

export function UserInteractiveContent({ 
  user, 
  userId, 
}: UserInteractiveContentProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Active Listings Section */}
      {user.activeListings.length > 0 && (
        <Suspense fallback={<div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        </div>}>
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <UserListings
              userId={userId}
              initialListings={user.activeListings}
              categories={user.categories}
              totalListings={user.totalListings}
            />
          </motion.div>
        </Suspense>
      )}

      {/* Reviews Section */}
      <Suspense fallback={<div className="space-y-4">
        <Skeleton className="h-8 w-1/3" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full rounded-lg" />
        ))}
      </div>}>
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <ReviewsList reviews={mockReviews} />
        </motion.div>
      </Suspense>
    </motion.div>
  );
} 