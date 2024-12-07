import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { QueryResult } from "pg";

export const authoptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
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
          const query = "SELECT user_id, email, password, role FROM users WHERE email = $1";
          const result: QueryResult = await db.query(query, [email]);

          if (result.rowCount === 0) {
            return null; // No user found
          }

          const user = result.rows[0];
          const isPasswordValid = await bcrypt.compare(password, user.password);
          if (!isPasswordValid) {
            return null; // Invalid password
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
      if (account?.provider === "google") {
        const email = profile?.email!;
        const name = profile?.name || "Google User";

        try {
          const query = "SELECT user_id, email, role FROM users WHERE email = $1";
          const result = await db.query(query, [email]);

          if (result.rowCount === 0) {
            // User doesn't exist, create a new user
            const defaultPassword = await bcrypt.hash("defaultGooglePassword123!", 10);

            const insertQuery = `
              INSERT INTO users (username, name, email, password, role)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING user_id, email, role
            `;
            const insertValues = [
              email.split("@")[0],
              name,
              email,
              defaultPassword,
              "regular user",
            ];

            const insertResult = await db.query(insertQuery, insertValues);
            const newUser = insertResult.rows[0];
            token.user_id = newUser.user_id;
            token.role = "regular user";
          } else {
            // User exists, return their details
            const existingUser = result.rows[0];
            token.user_id = existingUser.user_id;
            token.role = existingUser.role;
          }
        } catch (error) {
          console.error("Database query failed during Google login:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          user_id: token.user_id,
          role: token.role,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
    error: "/error",
    newUser: "/browse-pets",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
