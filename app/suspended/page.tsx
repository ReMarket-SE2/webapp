import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { AlertTriangle, Mail } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function SuspendedPage() {
  const session = await getServerSession(authOptions);

  // If user is not logged in, redirect to sign in
  if (!session?.user) {
    redirect('/auth/sign-in');
  }

  // If user is not suspended, redirect to dashboard
  if (session.user.status !== 'suspended') {
    redirect('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="mt-4 text-xl font-semibold text-gray-900">
            Account Suspended
          </CardTitle>
          <CardDescription className="mt-2">
            Your account has been temporarily suspended and access to our platform has been restricted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-800">
              This suspension may be due to a violation of our terms of service or community guidelines.
              If you believe this is a mistake, please contact our support team.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="mailto:support@example.com" className="flex items-center">
                <Mail className="mr-2 h-4 w-4" />
                Contact Support
              </Link>
            </Button>
            
            <Button asChild variant="secondary" className="w-full">
              <Link href="/api/auth/signout">
                Sign Out
              </Link>
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Account ID: {session.user.id}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
