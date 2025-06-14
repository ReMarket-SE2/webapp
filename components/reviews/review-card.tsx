"use client";

import { Review } from "@/lib/db/schema/reviews";
import { Star } from "lucide-react";
import { Card } from "../ui/card";

interface ReviewCardProps {
  review: Review;
}

export function ReviewCard({ review }: ReviewCardProps) {
  return (
    <Card className="bg-muted/50 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold mb-1">{review.title}</h3>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${
                  i < review.score ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      <p className="text-muted-foreground mb-4">{review.description}</p>
      <div className="text-sm text-muted-foreground">
        {new Date(review.createdAt).toLocaleDateString()}
      </div>
    </Card>
  );
} 