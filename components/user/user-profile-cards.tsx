"use client";

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Package, Archive, Star } from 'lucide-react';
import { ScrollToReviews } from '@/components/reviews/scroll-to-reviews';
import { mockReviewStats } from '@/lib/reviews/mock-data';

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

interface UserProfileCardsProps {
  user: {
    bio: string | null;
    username: string;
    createdAt: Date;
    activeListingsCount: number;
    archivedListingsCount: number;
  };
}

export function UserProfileCards({ user }: UserProfileCardsProps) {
  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Left Column */}
      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">About</h2>
            <p className="text-muted-foreground">
              {user.bio || 'No bio provided.'}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-muted/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Listings</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold">{user.activeListingsCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Archived</p>
                  <p className="text-lg font-semibold">{user.archivedListingsCount}</p>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Right Column */}
      <div className="space-y-6">
        <motion.div variants={itemVariants}>
          <Card className="bg-muted/50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Details</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                <p className="text-lg">{user.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Seller Rating</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 * i }}
                      >
                        <Star
                          className={`h-5 w-5 ${
                            i < Math.round(mockReviewStats.averageScore)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground"
                          }`}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <span className="text-lg font-semibold">
                    {mockReviewStats.averageScore.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    ({mockReviewStats.totalReviews} reviews)
                  </span>
                </div>
                <ScrollToReviews />
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
} 