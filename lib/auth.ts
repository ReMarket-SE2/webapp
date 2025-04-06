import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions, Profile } from "next-auth";
import { userAction } from "@/lib/users/actions";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { oauthAccounts } from "./db/schema/oauth_accounts";
import { eq } from "drizzle-orm";
import { users } from "./db/schema/users";
import { photos } from "./db/schema/photos";

// Extend the built-in session types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string | null;
    }
  }
  
  interface User {
    id: string;
    role?: string;
    name?: string;
    email?: string;
  }
}

// Extend JWT type to include our custom fields
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
  }
}

export interface GoogleProfile extends Profile {
  picture?: string;
}

// Helper function to fetch and convert image to base64
export async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.error('Failed to fetch image:', response.status, response.statusText);
      return null;
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return `data:${response.headers.get('content-type')};base64,${buffer.toString('base64')}`;
  } catch (error) {
    console.error('Error fetching profile image:', error);
    return null;
  }
}

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
      if (!user || !user.passwordHash) return null
      
      const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
      if (!passwordsMatch) return null

      return {
        id: String(user.id),
        email: user.email,
        name: user.username,
        role: user.role
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
    async signIn({ user, account, profile }) {
      if (account?.provider !== 'google') return true;

      let photoId: number | null = null;

      try {
        // Check if we already have this Google account
        const existingOAuth = await db.select().from(oauthAccounts)
          .where(eq(oauthAccounts.providerAccountId, profile?.sub as string))
          .innerJoin(users, eq(users.id, oauthAccounts.userId))
          .limit(1)
          .then(rows => rows[0]);

        if (existingOAuth) {
          // User already exists, update their session
          user.id = String(existingOAuth.users.id);
          user.email = existingOAuth.users.email;
          user.name = existingOAuth.users.username;
          return true;
        }

        // Only fetch and store profile image for new accounts or account linking
        if ((profile as GoogleProfile)?.picture) {
          try {
            const imageBase64 = await fetchImageAsBase64((profile as GoogleProfile).picture as string);
            if (imageBase64) {
              const [photo] = await db.insert(photos)
                .values({ image: imageBase64 })
                .returning();
              photoId = photo.id;
            }
          } catch (error) {
            console.error('Error handling profile image:', error);
            // Continue with null photoId
          }
        }

        // Check if user exists with this email
        const existingUser = await userAction.findByEmail(profile?.email as string);
        
        if (existingUser) {
          // Update existing user's profile image if provided
          if (photoId) {
            await db.update(users)
              .set({ profileImageId: photoId })
              .where(eq(users.id, existingUser.id));
          }

          // Link the Google account to existing user
          await db.insert(oauthAccounts).values({
            userId: existingUser.id,
            provider: 'google',
            providerAccountId: profile?.sub as string,
          });
          
          user.id = String(existingUser.id);
          user.email = existingUser.email;
          user.name = existingUser.username;
          return true;
        }

        // Create new user and OAuth account
        const newUser = await userAction.create({
          email: profile?.email as string,
          username: profile?.name?.replace(/\s+/g, '') as string,
          passwordHash: null,
          role: 'user',
          profileImageId: photoId,
          bio: null, // Added bio field with default value of null
          password_reset_token: null,
          password_reset_expires: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db.insert(oauthAccounts).values({
          userId: newUser.id,
          provider: 'google',
          providerAccountId: profile?.sub as string,
        });

        user.id = String(newUser.id);
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        if ('role' in user) {
          token.role = user.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  }
};
