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
          const query = "SELECT user_id, email, password, role FROM users WHERE email = $1";
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
        // Initialize `id` and `role` with defaults if not set
        token.user_id = token.id || null; // Use `null` or a default value that aligns with your type definition
        token.role = token.role || "guest"; // Default role

        if (account?.provider === "google") {
          const email = profile?.email!;
          const name = profile?.name || "Google User";

          const query = "SELECT id, email, role FROM users WHERE email = $1";
          try {
            const result = await db.query(query, [email]);

            if (result.rowCount === 0) {
              // If user doesn't exist, create one
              const defaultPassword = await bcrypt.hash("defaultGooglePassword123!", 10);

              const insertQuery = `
                INSERT INTO users (username, name, email, password, role)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, email, role
              `;
              const insertValues = [
                email.split("@")[0], // Default username from email
                name,
                email,
                defaultPassword,
                "regular user",
              ];

              const insertResult: QueryResult = await db.query(insertQuery, insertValues);
              const newUser = insertResult.rows[0];
              token.id = newUser.id;
              token.role = newUser.role;
            } else {
              // If user exists, update token with existing user details
              const existingUser = result.rows[0];
              token.id = existingUser.id;
              token.role = existingUser.role;
            }
          } catch (error) {
            console.error("Database query failed:", error);
          }
        }
        return token;
      }
  },
  secret: process.env.NEXTAUTH_SECRET,
};