import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getUserProfile } from '@/lib/users/actions';
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
  
  // Get user profile with blocked status
  const profileResult = await getUserProfile(userId);
  
  if (!profileResult) {
    return notFound();
  }
  
  const { user, blocked } = profileResult;
  
  // If user is blocked and it's not the user's own profile, show blocked message
  if (blocked && !isOwnProfile) {
    return (
      <div className="container mx-auto py-10">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>User Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center py-8">This user profile is not available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Get profile image separately
  const userData = await db
    .select({
      profileImage: photos,
    })
    .from(photos)
    .where(eq(photos.id, user.profileImageId || 0))
    .limit(1);
  
  const profileImage = userData.length > 0 ? userData[0].profileImage : null;

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl flex items-center justify-between">
            <span>{isOwnProfile ? 'Your Profile' : `${user.username}'s Profile`}</span>
            {isOwnProfile && (
              <Button asChild size="sm">
                <Link href="/user/edit">Edit Profile</Link>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex flex-col items-center gap-4">
              <Avatar className="w-32 h-32">
                {profileImage?.image ? (
                  <AvatarImage src={profileImage.image} alt={user.username} />
                ) : (
                  <AvatarFallback className="text-4xl">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            </div>
            <div className="flex-1 space-y-4">
              <div>
                <h3 className="text-lg font-semibold">Username</h3>
                <p>{user.username}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Bio</h3>
                <p className="text-muted-foreground">
                  {user.bio || 'No bio provided.'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Member Since</h3>
                <p>{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}