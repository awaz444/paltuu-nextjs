import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";
import { db } from "@/db/index";
import { QueryResult } from "pg";

export const authoptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
          const query = "SELECT user_id, email, password, role, name, profile_image_url FROM users WHERE email = $1";
          const result: QueryResult = await db.query(query, [email]);

          if (result.rowCount === 0) {
            return null; // No user found
          }

          const user = result.rows[0];

          // Check if password is hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
          const isHashedPassword = user.password && user.password.startsWith('$2');

          let isPasswordValid = false;

          if (isHashedPassword) {
            // For new users with hashed passwords, use bcrypt
            isPasswordValid = await bcrypt.compare(password, user.password);
          } else {
            // For existing users with plain-text passwords, do direct comparison
            isPasswordValid = password === user.password;
          }

          if (!isPasswordValid) {
            return null; // Invalid password
          }

          return {
            id: user.user_id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
            image: user.profile_image_url,
          };
        } catch (error) {
          console.error("Error authorizing credentials:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user }) {
      // Initial sign in
      if (user) {
        token.user_id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
      }

      if (account?.provider === "google") {
        const email = profile?.email!;
        const name = profile?.name || "Google User";

        try {
          const query = "SELECT user_id, email, role, name, profile_image_url FROM users WHERE email = $1";
          const result = await db.query(query, [email]);

          if (result.rowCount === 0) {
            // User doesn't exist, create a new user
            const defaultPassword = await bcrypt.hash("defaultGooglePassword123!", 10);

            const insertQuery = `
              INSERT INTO users (username, name, email, password, role)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING user_id, email, role, name, profile_image_url
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
            token.user_id = newUser.user_id.toString();
            token.role = "regular user";
            token.name = newUser.name;
            token.picture = newUser.profile_image_url || (profile as any)?.picture;
          } else {
            // User exists, return their details
            const existingUser = result.rows[0];
            token.user_id = existingUser.user_id.toString();
            token.role = existingUser.role;
            token.name = existingUser.name;
            token.picture = existingUser.profile_image_url || (profile as any)?.picture;
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
          name: token.name,
          image: token.picture,
        },
      };
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === "production"
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
