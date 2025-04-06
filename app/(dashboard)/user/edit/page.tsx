import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EditProfileForm from '@/components/user/edit-profile-form';
import { db } from '@/lib/db';
import { photos, users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/auth/sign-in');
  }

  // Get user data with profile image
  const userData = await db
    .select({
      user: users,
      profileImage: photos,
    })
    .from(users)
    .leftJoin(photos, eq(users.profileImageId, photos.id))
    .where(eq(users.id, parseInt(session.user.id)))
    .limit(1);

  if (!userData.length) {
    redirect('/user');
  }

  const { user, profileImage } = userData[0];

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
        <EditProfileForm 
          user={user} 
          profileImageData={profileImage?.image} 
        />
      </div>
    </div>
  );
}