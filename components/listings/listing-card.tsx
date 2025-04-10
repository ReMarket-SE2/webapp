import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ShortListing } from "@/lib/listings/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ListingCardProps {
  listing: ShortListing;
}

export function ListingCard({ listing }: ListingCardProps) {
  return (
    <Link href={`/listing/${listing.id}`} className="block">
      <Card className="w-64 h-80 flex flex-col justify-between hover:shadow-xl hover:scale-105 transition-transform duration-200">
        <CardHeader className="relative h-40 overflow-hidden">
          <Image
            src={listing.photo || "/no-image.png"}
            alt={listing.title}
            fill
            className="object-cover"
          />
        </CardHeader>
        <CardContent className="flex flex-col gap-2 p-4">
          <CardTitle className="truncate text-lg font-semibold">{listing.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">Category:</span> {listing.category || "N/A"}
          </p>
          <p className="text-sm font-bold text-primary">${listing.price}</p>
        </CardContent>
      </Card>
    </Link>
  );
}