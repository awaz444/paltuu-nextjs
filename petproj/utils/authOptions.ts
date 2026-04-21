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
          let res = await db.query(
            "SELECT user_id, role FROM users WHERE email = $1",
            [profile.email]
          );

          // Auto-register Google users if they don't exist
          if (res.rows.length === 0) {
            console.log(`[Auth] Auto-registering Google user: ${profile.email}`);
            const randomPassword = require('crypto').randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            res = await db.query(
              "INSERT INTO users (name, email, password, role, profile_image_url, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, role",
              [profile.name || "Google User", profile.email, hashedPassword, 'regular user', (profile as any).picture || null, "google", profile.sub]
            );
          }

          if (res.rows.length > 0) {
            token.id = res.rows[0].user_id;
            token.user_id = res.rows[0].user_id;
            token.role = res.rows[0].role || 'regular user';
            console.log(`[Auth] Mapped Google user ${profile.email} to DB ID ${token.id}`);

            // Also generate and set the mobile compatible JWT token cookie here so the rest of the app can read it
            try {
              const { generateMobileTokenPair } = require("@/utils/mobileAuth");
              const { cookies } = require("next/headers");
              const tokens = await generateMobileTokenPair({
                user_id: res.rows[0].user_id,
                email: profile.email,
                role: res.rows[0].role || 'regular user'
              });

              cookies().set('token', tokens.accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7 days
              });
              console.log(`[Auth] Set custom JWT token cookie for Google user ${profile.email}`);
            } catch (err) {
              console.error("[Auth] Failed to set custom JWT token for Google user", err);
            }
          }
        } catch (dbError) {
          console.error("[Auth] Database error mapping/creating Google user:", dbError);
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
