import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { userAction } from "@/lib/users/actions";
import bcrypt from "bcryptjs";


const providers: Array<ReturnType<typeof CredentialsProvider | typeof GoogleProvider>> = [
  CredentialsProvider({
    name: 'Credentials',
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      const { email, password } = credentials as { email: string; password: string }
      if (!email || !password) return null
      
      const user = await userAction.findByEmail(email)
      if (!user) return null
      
      const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
      if (!passwordsMatch) return null

      return {
        id: String(user.id),
        email: user.email,
        name: user.username,
      }
    }
  }),
];

// Only add GoogleProvider if env vars are defined
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
} else {
  console.warn("Google Auth provider not configured: Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: '/auth/sign-in',
    signOut: '/auth/sign-out',
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  session: {
    maxAge: 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
      }
      return session;
    },
  }
};
