"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Tag, User, Package, Archive, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { ListingWithPhotos } from "@/lib/listings/actions";
import { formatPrice } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";

interface ListingDetailsProps {
  listing: ListingWithPhotos;
}

export default function ListingDetails({ listing }: ListingDetailsProps) {
  const {
    title,
    price,
    description,
    categoryName,
    status,
    createdAt,
    seller
  } = listing;

  // Format the creation date
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="outline">{status}</Badge>
          {categoryName && (
            <Badge variant="secondary">
              <Tag className="h-4 w-4 mr-1" />
              {categoryName}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            Posted on {formattedDate}
          </Badge>
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
        <div className="flex gap-3">
          <Button className="flex-1" onClick={handleAddToCart}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Add to Cart
          </Button>
          <Button variant="outline" size="icon" onClick={handleAddToWishlist}>
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Seller Information Card */}
      {seller && (
        <motion.div variants={item} className="mt-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Seller Information</h3>
            <div className="flex items-center mb-3">
              <Avatar className="">
                {seller.profileImage ? (
                  <AvatarImage src={seller.profileImage} alt={seller.username} />
                ) : (
                  <AvatarFallback>
                    <User className="h-5 w-5" />
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="ml-2">
                <p className="font-medium">{seller.username}</p>
              </div>
            </div>

            <Separator className="my-4" />

            {seller.bio && (
              <div className="text-sm text-muted-foreground">
                <p>{seller.bio}</p>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              <div className="flex items-center">
                <Package className="mr-1 h-4 w-4 text-primary" />
                <span>Active: {seller.activeListingsCount}</span>
              </div>
              <div className="flex items-center">
                <Archive className="mr-1 h-4 w-4 text-muted-foreground" />
                <span>Archived: {seller.archivedListingsCount}</span>
              </div>
            </div>
            
            <div className="mt-3 space-y-2">
              <Button className="w-full text-xs" variant="secondary" size="sm">
                <User className="mr-1 h-3 w-3" />
                View Profile
              </Button>
              <Button className="w-full text-xs" variant="outline" size="sm">
                <ExternalLink className="mr-1 h-3 w-3" />
                See All Listings
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
} 