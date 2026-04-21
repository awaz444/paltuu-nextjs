import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db/index";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await db.query("SELECT * FROM users WHERE email = $1", [credentials.email]);
        const user = res.rows[0];

        if (user && (await bcrypt.compare(credentials.password, user.password))) {
          return {
            id: user.user_id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 1. Initial Login (Credentials or Google)
      if (user) {
        token.id = user.id;
        token.user_id = user.id;
        token.role = (user as any).role || 'regular user';
      }

      // 2. Specialized handling for Google to get the database's integer user_id
      if (account?.provider === "google" && profile?.email) {
        try {
          const res = await db.query(
            "SELECT user_id, role FROM users WHERE email = $1", 
            [profile.email]
          );
          
          if (res.rows.length > 0) {
            token.id = res.rows[0].user_id;
            token.user_id = res.rows[0].user_id;
            token.role = res.rows[0].role || 'regular user';
            console.log(`[Auth] Mapped Google user ${profile.email} to DB ID ${token.id}`);
          } else {
            console.warn(`[Auth] Google user ${profile.email} not found in DB users table`);
          }
        } catch (dbError) {
          console.error("[Auth] Database error mapping Google user:", dbError);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).user_id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
