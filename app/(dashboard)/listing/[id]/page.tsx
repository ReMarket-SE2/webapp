import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/listings/actions';
import ListingDetails from '@/components/listings/listing-details';
import ListingImagesGallery from '@/components/listings/listing-images-gallery';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { DetailedDescription } from '@/components/listings/detailed-description';

interface ListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ListingPage({ params }: ListingPageProps) {
  const { id } = await params;

  if (isNaN(parseInt(id))) {
    return notFound();
  }

  const listing = await getListingById(parseInt(id));

  if (!listing) {
    return notFound();
  }

  return (
    <div className="container w-full p-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/listings">Listings</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <span className="text-muted-foreground truncate max-w-[200px]">{listing.title}</span>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <Suspense fallback={<Skeleton className="rounded-lg aspect-[4/3] w-full" />}>
          <ListingImagesGallery images={listing.photos} title={listing.title} />
        </Suspense>

        <Suspense fallback={<div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>}>
          <ListingDetails listing={listing} />
        </Suspense>
      </div>

      {listing.longDescription && (
        <Suspense fallback={<div className="space-y-4 mt-8">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>}>
          <DetailedDescription longDescription={listing.longDescription} />
        </Suspense>
      )}
    </div>
  );
} 
