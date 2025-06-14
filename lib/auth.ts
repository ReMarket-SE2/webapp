import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions, Profile } from "next-auth";
import { findUserByEmail, createUser, findUserByUsername } from "@/lib/users/actions";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { oauthAccounts } from "./db/schema/oauth_accounts";
import { eq } from "drizzle-orm";
import { users } from "./db/schema/users";
import { photos } from "./db/schema/photos";

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
      
      const user = await findUserByEmail(email)
      if (!user || !user.passwordHash) return null
      
      const passwordsMatch = await bcrypt.compare(password, user.passwordHash)
      if (!passwordsMatch) return null

      // Check if email is verified
      if (!user.emailVerified) {
        throw new Error('Please verify your email address before signing in. Check your email for a verification link.')
      }

      // Check if user account is active or suspended
      if (user.status === 'suspended') {
        throw new Error('Your account has been suspended. Please contact support for assistance.')
      }
      
      if (user.status === 'inactive') {
        throw new Error('Your account is not active. Please contact support.')
      }

      return {
        id: String(user.id),
        email: user.email,
        name: user.username,
        role: user.role,
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
          user.role = existingOAuth.users.role;
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
        const existingUser = await findUserByEmail(profile?.email as string);
        
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
          user.role = existingUser.role;
          return true;
        }

        // Create new user and OAuth account
        // Check if the username already exists
        const existingUsername = await findUserByUsername(profile?.name?.replace(/\s+/g, '') as string);
        let uniqueSuffix = '';
        if (existingUsername) {
          uniqueSuffix = `_${Math.random().toString(36).substring(2, 8)}`; // so that users with the same first and last name can register
        }

        const newUser = await createUser({
          email: profile?.email as string,
          username: `${profile?.name?.replace(/\s+/g, '')}${uniqueSuffix}` as string,
          passwordHash: null,
          role: 'user',
          status: 'active',
          emailVerified: true,
          profileImageId: photoId,
          bio: null,
          password_reset_token: null,
          password_reset_expires: null,
          email_verification_token: null,
          email_verification_expires: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        await db.insert(oauthAccounts).values({
          userId: newUser.id,
          provider: 'google',
          providerAccountId: profile?.sub as string,
        });

        user.id = String(newUser.id);
        user.email = newUser.email;
        user.name = newUser.username;
        user.role = newUser.role;
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        return false;
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      const dbUser = await db
         .select({
           id: users.id,
           username: users.username,
           email: users.email,
           role: users.role,
           image: photos.image,
         })
         .from(users)
         .leftJoin(photos, eq(photos.id, users.profileImageId))
         .where(eq(users.id, Number(token.id) ))
         .then((rows) => rows[0]);
 
       if (session.user && dbUser) {
         session.user.id    = String(dbUser.id);
         session.user.name  = dbUser.username;
         session.user.email = dbUser.email;
         session.user.role  = dbUser.role;
         session.user.image = dbUser.image ?? undefined;
       }
      return session;
    },
  }
};

/**
 * Helper function to check if a user is suspended
 * Throws an error if the user is suspended, otherwise returns silently
 */
export async function checkUserSuspension(userId: number): Promise<void> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  if (user.status === 'suspended') {
    throw new Error('Your account has been suspended. Please contact support for assistance.');
  }
}
