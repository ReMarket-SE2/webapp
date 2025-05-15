"use client";

import { useState } from "react";
import { Review } from "@/lib/db/schema/reviews";
import { ReviewCard } from "./review-card";
import { Button } from "@/components/ui/button";
import { ArrowUpDown, Star } from "lucide-react";

interface ReviewsListProps {
  reviews: Review[];
}

export function ReviewsList({ reviews: initialReviews }: ReviewsListProps) {
  const [reviews, setReviews] = useState(initialReviews);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (by: 'date' | 'score') => {
    const newSortOrder = sortBy === by ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc';  
    const newSortBy = by;  

    const sorted = [...reviews].sort((a, b) => {  
      if (newSortBy === 'date') {  
        return newSortOrder === 'asc'  
          ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()  
          : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();  
      } else {  
        return newSortOrder === 'asc' ? a.score - b.score : b.score - a.score;  
      }  
    });  

    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setReviews(sorted);
  };

  return (
    <div id="reviews-section" className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Reviews</h2>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('date')}
            className={sortBy === 'date' ? 'bg-muted' : ''}
          >
            <ArrowUpDown className="h-4 w-4 mr-2" />
            {sortBy === 'date' && sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSort('score')}
            className={sortBy === 'score' ? 'bg-muted' : ''}
          >
            <Star className="h-4 w-4 mr-2" />
            {sortBy === 'score' && sortOrder === 'desc' ? 'Highest Rated' : 'Lowest Rated'}
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
} 