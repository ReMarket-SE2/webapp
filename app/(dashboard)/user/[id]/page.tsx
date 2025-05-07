import React from 'react';
import { notFound } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { findUserById, getProfileImage } from '@/lib/users/actions';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const userId = parseInt(id);
  
  if (isNaN(userId)) {
    return notFound();
  }
  
  const session = await getServerSession(authOptions);
  const isOwnProfile = session?.user?.id === id;
  
  const user = await findUserById(userId);
  
  if (!user) {
    return notFound();
  }
  
  const profileImage = await getProfileImage(user!.profileImageId);

  return (
    <div className="min-h-screen bg-background mt-4">
      {/* Hero Section */}
      <div className="relative h-48 bg-gradient-to-r from-primary/20 to-primary/10">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-muted-foreground">
                  {user.bio || 'No bio provided.'}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-muted/50 rounded-lg p-6">
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}