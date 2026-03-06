import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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
          const res = await fetch("http://localhost:8080/core/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const result = await res.json();

          if (res.ok && result.success && result.user) {
            return {
              id: result.user.user_id,
              email: result.user.email,
              role: result.user.role,
            };
          }
          return null;
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
          const res = await fetch("http://localhost:8080/core/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, name }),
          });
          const result = await res.json();

          if (res.ok && result.success && result.user) {
            token.user_id = result.user.user_id;
            token.role = result.user.role;
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
    signIn: "/auth",
    error: "/error",
    newUser: "/browse-pets",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
