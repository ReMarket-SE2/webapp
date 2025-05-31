import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth;
    const { pathname } = req.nextUrl;

    // Allow access to suspension page and auth pages
    if (pathname.startsWith('/suspended') || 
        pathname.startsWith('/auth/') || 
        pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // If user is suspended, redirect to suspension page
    if (token?.status === 'suspended') {
      return NextResponse.redirect(new URL('/suspended', req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: '/auth/sign-in',
    },
  }
);

export const config = {
  matcher: [
    '/create-listing/:path*',
    '/admin/:path*',
    '/user/:path*',
    '/orders/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico|public|suspended).*)',
  ],
};
