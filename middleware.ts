import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/auth/sign-in',
  },
});

export const config = {
  matcher: ['/protected/:path*', '/api/protected/:path*'],
};
