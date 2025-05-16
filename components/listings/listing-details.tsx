"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Tag, User, Package, Archive, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ListingWithPhotos } from "@/lib/listings/actions";
import { formatPrice } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { deleteListing } from '@/lib/listings/actions';
import React from 'react';
import Link from 'next/link';
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useWishlistContext } from "@/components/contexts/wishlist-provider";
import { mockReviewStats } from "@/lib/reviews/mock-data";
import { ShippingLabel } from "@/components/shipping-label/shipping-label";
import { ShippingLabelData } from "@/components/shipping-label/shipping-label";
import { fetchShippingLabelData } from "@/lib/shipping-label/actions";
import { getBuyerByListingId, getOrderByListingId, getSellerByListingId } from "@/lib/order/actions";

interface ListingDetailsProps {
  listing: ListingWithPhotos;
  isSold?: boolean;
  sessionUserId?: number | null;
}

export default function ListingDetails({ listing, isSold, sessionUserId }: ListingDetailsProps) {
  const {
    id,
    title,
    price,
    description,
    categoryName,
    status,
    createdAt,
    seller,
  } = listing;
  const session = useSession();
  const userId = session.data?.user?.id;
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlistContext();
  const [isInWishlist, setIsInWishlist] = useState(false);

  useEffect(() => {
    setIsInWishlist(wishlist.some(item => item.id === id));
  }, [wishlist, id]);

  const toggleWishlist = async () => {
    if (!userId) {
      toast.info("You need to be logged in to manage your wishlist.");
      return;
    }

    if (isInWishlist) {
      try {
        await removeFromWishlist(id);
        setIsInWishlist(false);
      } catch (error) {
        toast.error("Failed to remove from wishlist.");
        console.error("Error removing from wishlist:", error);
      }
    } else {
      try {
        await addToWishlist(id);
        setIsInWishlist(true);
      } catch (error) {
        toast.error("Failed to add to wishlist.");
        console.error("Error adding to wishlist:", error);
      }
    }
  };

  const router = useRouter();
  const [isDeleting, setIsDeleting] = React.useState(false);

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

  async function handleDelete() {
    setIsDeleting(true);
    const res = await deleteListing(listing.id);
    setIsDeleting(false);
    if (res.success) {
      toast.success('Listing deleted');
      router.push('/listings');
    } else {
      toast.error(res.error || 'Failed to delete listing');
    }
  }

  // --- Shipping Label State ---
  const [isLabelOpen, setIsLabelOpen] = useState(false);
  const [isLabelLoading, setIsLabelLoading] = useState(false);
  const [shippingLabelData, setShippingLabelData] = useState<ShippingLabelData | null>(null);

  async function handlePrintShippingLabel() {
    setIsLabelLoading(true);
    try {
      const seller = await getSellerByListingId(listing.id);
      const buyer = await getBuyerByListingId(listing.id);
      const order = await getOrderByListingId(listing.id);

      if (!seller || !buyer || !order) {
        toast.error("Unable to fetch shipping label data.");
        return;
      }

      const data = await fetchShippingLabelData(seller, buyer, order);
      setShippingLabelData(data);
      setIsLabelOpen(true);
    } catch (e) {
      console.error("Error fetching shipping label data:", e);
      toast.error("Failed to load shipping label data.");
    }
    setIsLabelLoading(false);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <motion.div
      className="space-y-6"
      variants={container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight truncate max-w-full overflow-hidden">
          {title}
        </h1>
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

      {/* Owner controls */}
      {sessionUserId && seller && sessionUserId === seller.id ? (
        isSold ? (
          <motion.div variants={item}>
            <div className="flex gap-3">
              <Button
                className="flex-1"
                variant="outline"
                onClick={handlePrintShippingLabel}
                disabled={isLabelLoading}
              >
                {isLabelLoading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Loading...
                  </>
                ) : (
                  <>Print Shipping Label</>
                )}
              </Button>
              <Dialog open={isLabelOpen} onOpenChange={setIsLabelOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Shipping Label</DialogTitle>
                    <DialogDescription>
                      Print and attach this label to your package.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center py-2">
                    {shippingLabelData ? (
                      <ShippingLabel data={shippingLabelData} />
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="animate-spin h-4 w-4" />
                        Loading label...
                      </div>
                    )}
                  </div>
                  <DialogFooter className="print:hidden">
                    <Button onClick={handlePrint} variant="secondary">
                      Print
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button
                className="flex-1"
                variant="outline"
                disabled
              >
                Mark As Shipped
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div variants={item}>
            <div className="flex gap-3">
              <Link href={`/listing/${listing.id}/edit`} className="flex-1">
                <Button variant="outline" className="w-full">
                  Edit
                </Button>
              </Link>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex-1" disabled={isDeleting}>
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Listing?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your listing.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive text-white hover:bg-destructive/90">
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </motion.div>
        )
      ) : (
        isSold ? (
          <motion.div variants={item}>
            <div className="w-full flex items-center justify-center bg-muted rounded-md p-4 text-muted-foreground font-semibold">
              This item has already been sold.
            </div>
          </motion.div>
        ) : (
          <motion.div variants={item}>
            <div className="flex gap-3">
              <Button className="flex-1" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleWishlist}
                className={isInWishlist ? "text-red-500" : ""}
              >
                <Heart className={`h-4 w-4 ${isInWishlist ? "fill-current" : ""}`} />
              </Button>
            </div>
          </motion.div>
        )
      )}

      {/* Seller Information Card */}
      {seller && (
        <motion.div variants={item} className="mt-6">
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Seller Information</h3>
            <Link href={`/user/${seller.id}`} className="flex items-center mb-3 hover:opacity-80 transition-opacity">
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
            </Link>

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

            {/* Seller Rating */}
            <div className="mt-3 flex items-center gap-2">
              <div className="flex items-center">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.round(mockReviewStats.averageScore)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-medium">
                {mockReviewStats.averageScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">
                ({mockReviewStats.totalReviews} reviews)
              </span>
            </div>
            
            <div className="mt-3 space-y-2">
              <Button asChild className="w-full text-xs" variant="secondary" size="sm">
                <Link href={`/user/${seller.id}`}>
                  <User className="mr-1 h-3 w-3" />
                  View Profile
                </Link>
              </Button>              
            </div>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
