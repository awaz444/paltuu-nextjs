import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { QueryResult } from "pg";
import GoogleProvider from "next-auth/providers/google";

export const authoptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: any): Promise<any> {
        const { email, password } = credentials;

        try {
          const query =
            "SELECT user_id, email, password, role FROM users WHERE email = $1";
          const result: QueryResult = await db.query(query, [email]);

          if (result.rowCount === 0) {
            return null; // No user found
          }

          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null;
          }

          return {
            id: user.user_id,
            email: user.email,
            role: user.role,
          };
        } catch (error) {
          console.error("Error authorizing credentials:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Handle JWT token customization here (no changes needed)
      return token;
    },
    async session({ session, token }) {
      // Append additional data to the session
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to /browse-pets after login
      return "/browse-pets";
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
