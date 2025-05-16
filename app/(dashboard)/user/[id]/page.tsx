import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { findUserById, getProfileImage } from '@/lib/users/actions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { UserInteractiveContent } from '@/components/user/user-interactive-content';
import { UserProfileCards } from '@/components/user/user-profile-cards';

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
      <div 
        className="relative h-48" 
        style={{ backgroundImage: "url('/user/seller_background.png')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
          <Suspense fallback={<Skeleton className="w-32 h-32 rounded-full" />}>
            <Avatar className="w-32 h-32 border-4 border-background">
              {profileImage ? (
                <AvatarImage src={profileImage} alt={user.username} className="object-cover" />
              ) : (
                <AvatarFallback className="text-4xl">
                  {user.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          </Suspense>
        </div>
      </div>

      {/* Profile Content */}
      <div className="container mx-auto pt-20 pb-10 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <Suspense fallback={<div className="text-center mb-8">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </div>}>
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
          </Suspense>

          {/* Profile Cards */}
          <UserProfileCards user={user} />

          {/* Interactive Content */}
          <UserInteractiveContent 
            user={user} 
            userId={userId} 
          />
        </div>
      </div>
    </div>
  );
}