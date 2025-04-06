import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { userAction } from '@/lib/users/actions';
import { authOptions } from '@/lib/auth';
import EditProfileForm from '@/components/user/edit-profile-form';

export default async function EditProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/auth/sign-in');
  }

  const userId = parseInt(session.user.id);

  const user = await userAction.findById(userId);
  const profileImage = await userAction.getProfileImage(userId);

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Edit Profile</h1>
        <EditProfileForm 
          user={user!} 
          profileImageData={profileImage} 
        />
      </div>
    </div>
  );
}