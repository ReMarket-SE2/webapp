import React from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "timeago.js";
import { ShortListing } from "@/lib/listings/actions";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "../ui/badge";

interface ListingCardProps {
  listing: ShortListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listings/${listing.id}`} className="block">
      <Card className="overflow-hidden hover:bg-muted transition-colors p-0 shadow-none">
        <div className="flex">
          <CardHeader className="relative w-48 h-48 shrink-0 p-0">
            <Image
              src={listing.photo || "/listing/no-image.png"}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, 25vw"
            />
          </CardHeader>
          <CardContent className="flex flex-col gap-2 p-4 flex-1 justify-between min-w-0">
            <div className="text-sm flex flex-col gap-1">
              <p className="font-medium line-clamp-3 break-words max-w-full">{listing.title}</p>
              <p className="text-xs text-muted-foreground">{format(listing.createdAt)}</p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <p className="text-lg font-bold text-primary">${listing.price}</p>
              <Badge variant="secondary">{listing.category || "Uncategorized"}</Badge>
            </div>
          </CardContent>
        </div>
      </Card>
    </Link>
  );
}