"use client";

import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

export function ScrollToReviews() {
  const handleClick = () => {
    document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="mt-2"
      onClick={handleClick}
    >
      <MessageSquare className="h-4 w-4 mr-2" />
      View All Reviews
    </Button>
  );
} 