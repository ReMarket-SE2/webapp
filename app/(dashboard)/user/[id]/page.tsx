import React from 'react';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { findUserById, getProfileImage } from '@/lib/users/actions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, Archive, Star } from 'lucide-react';
import { UserListings } from '@/components/listings/user-listings';
import { ReviewsList } from '@/components/reviews/reviews-list';
import { ScrollToReviews } from '@/components/reviews/scroll-to-reviews';
import { mockReviews, mockReviewStats } from '@/lib/reviews/mock-data';
import { Card } from '@/components/ui/card';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function UserProfilePage({ params }: PageProps) {
  const { id } = await params;
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    return notFound();
  }
  
  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === id;
  
  const user = await findUserById(userId, {
    page: 1,
    pageSize: 10,
    sortOrder: 'desc',
    categoryId: null,
  });
  
  if (!user) {
    return notFound();
  }
  
  const profileImage = await getProfileImage(user!.profileImageId);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-48" style={{ backgroundImage: "url('/user/seller_background.png')", backgroundSize: "cover", backgroundPosition: "center" }}>
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <Avatar className="w-32 h-32 border-4 border-background">
            {profileImage ? (
              <AvatarImage src={profileImage} alt={user.username} className="object-cover" />
            ) : (
              <AvatarFallback className="text-4xl">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto pt-20 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {isOwnProfile ? 'Your Profile' : `${user.username}'s Profile`}
            </h1>
            {isOwnProfile && (
              <Button asChild variant="outline" className="mt-4">
                <Link href="/user/edit">Edit Profile</Link>
              </Button>
            )}
          </div>

          {/* Profile Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Left Column */}
            <div className="space-y-6">
              <Card className="bg-muted/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-muted-foreground">
                  {user.bio || 'No bio provided.'}
                </p>
              </Card>

              {/* Listing Stats */}
              <Card className="bg-muted/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Listings</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Active</p>
                      <p className="text-lg font-semibold">{user.activeListingsCount}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Archived</p>
                      <p className="text-lg font-semibold">{user.archivedListingsCount}</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <Card className="bg-muted/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Details</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
                    <p className="text-lg">{user.username}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
                    <p className="text-lg">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Seller Rating</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-5 w-5 ${
                              i < Math.round(mockReviewStats.averageScore)
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-muted-foreground"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-semibold">
                        {mockReviewStats.averageScore.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground">
                        ({mockReviewStats.totalReviews} reviews)
                      </span>
                    </div>
                    <ScrollToReviews />
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Active Listings Section */}
          {user.activeListings.length > 0 && (
            <UserListings
              userId={userId}
              initialListings={user.activeListings}
              categories={user.categories}
              totalListings={user.totalListings}
            />
          )}

          {/* Reviews Section */}
          <ReviewsList reviews={mockReviews} />
        </div>
      </div>
    </div>
  );
}