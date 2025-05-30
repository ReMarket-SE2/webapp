import { notFound } from 'next/navigation';
import { getListingById } from '@/lib/listings/actions';
import ListingDetails from '@/components/listings/listing-details';
import ListingImagesGallery from '@/components/listings/listing-images-gallery';
import { Skeleton } from '@/components/ui/skeleton';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import Link from 'next/link';
import { DetailedDescription } from '@/components/listings/detailed-description';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getCategoryPath } from '@/lib/categories/actions';
import { Suspense } from 'react';

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

  // Get the full category path for the breadcrumb
  let categoryPath: { id: number; name: string }[] = [];
  if (listing.categoryId) {
    categoryPath = await getCategoryPath(listing.categoryId);
  }

  const session = await getServerSession(authOptions);
  const sessionUserId = session?.user?.id ? parseInt(session.user.id) : null;

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
          {/* Category cascade breadcrumb */}
          {categoryPath.map((cat) => (
            <div key={cat.id} className="inline-flex items-center gap-1.5">
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/listings?category=${cat.id}`} className='ml-2'>{cat.name}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
            </div>
          ))}
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
          <ListingDetails listing={listing} sessionUserId={sessionUserId} />
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

      {/* Owner controls */}
      {/* Owner controls are handled inside ListingDetails */}
    </div>
  );
}
