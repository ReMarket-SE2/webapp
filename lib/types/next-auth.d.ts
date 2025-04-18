// eslint-disable-next-line @typescript-eslint/no-unused-vars
import NextAuth from "next-auth";

// Extend the NextAuth session and user types
declare module "next-auth" {
    interface Session {
      user: {
        id: string;
        email?: string;
        name?: string;
        role?: string;
        image?: string;
      };
    }
  
    interface User {
      id: string;
      role: string;
      image?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
      id: string;
      role: string;
    }
}  