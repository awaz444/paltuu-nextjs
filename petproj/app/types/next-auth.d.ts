import { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

// Extend the User type
declare module "next-auth" {
  interface User extends DefaultUser {
    role?: string; // Add role property
  }

  interface Session {
    user: {
      id: string;
      role?: string; // Include role in the session
    } & DefaultSession["user"];
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role?: string; // Include role in the JWT token
  }
}
