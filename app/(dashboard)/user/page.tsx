import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function UserProfileRedirect() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    redirect('/auth/sign-in');
  }

  // Redirect to the dynamic user profile page with the user's ID
  redirect(`/user/${session.user.id}`);
}