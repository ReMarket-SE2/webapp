"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Heart } from "lucide-react";
import { toast } from "sonner";
import { ListingWithPhotos } from "@/lib/listings/actions";
import { formatPrice } from "@/lib/utils";
import Markdown from "react-markdown";

interface ListingDetailsProps {
  listing: ListingWithPhotos;
}

export default function ListingDetails({ listing }: ListingDetailsProps) {
  const {
    title,
    price,
    description,
    longDescription,
    categoryId,
    status
  } = listing;

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
    show: { opacity: 1, y: 0 }
  };

  const handleAddToCart = () => {
    toast.success("Added to cart");
    // Implement actual cart functionality
  };

  const handleAddToWishlist = () => {
    toast.success("Added to wishlist");
    // Implement actual wishlist functionality
  };

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline">{status}</Badge>
          {categoryId && <Badge variant="secondary">Category {categoryId}</Badge>}
        </div>
      </motion.div>

      <motion.div variants={item}>
        <div className="text-2xl font-bold">{formatPrice(parseFloat(price))}</div>
      </motion.div>

      {description && (
        <motion.div variants={item}>
          <h2 className="text-lg font-semibold">Description</h2>
          <p className="text-muted-foreground">{description}</p>
        </motion.div>
      )}

      <motion.div variants={item}>
        <Card className="p-4">
          <div className="flex gap-3">
            <Button className="flex-1" onClick={handleAddToCart}>
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Button variant="outline" size="icon" onClick={handleAddToWishlist}>
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </motion.div>

      {longDescription && (
        <motion.div variants={item} className="mt-8">
          <Separator className="my-4" />
          <h2 className="text-lg font-semibold mb-3">Detailed Description</h2>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{longDescription}</Markdown>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
} 