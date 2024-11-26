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
          const query = "SELECT id, email, password, role FROM users WHERE email = $1";
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
            id: user.id,
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

        const query = "SELECT id, email, role FROM users WHERE email = $1";
        const result = await db.query(query, [email]);

        if (result.rowCount === 0) {
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
          const existingUser = result.rows[0];
          token.id = existingUser.id;
          token.role = existingUser.role;
        }
      return token;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
}
};