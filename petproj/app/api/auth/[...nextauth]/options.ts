import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { db } from '@/db/index';
import { User } from "@/app/types/user";
import { QueryResult } from "pg";
import GoogleProvider from "next-auth/providers/google";


export const authoptions : NextAuthOptions = {
    providers: [
        //Google Oauth
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        }),
        //credentials
        CredentialsProvider ({
            id: "credentials",
            name: "Credentials",
            Credentials: {
                email: { label: "Email", type: "text"},
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials: any): Promise<any>{
                const { email, password } = credentials;

                try {
                  // Fetch user from the database
                  const query = "SELECT id, email, password, role FROM users WHERE email = $1";
                  const values = [email];
                  const result: QueryResult = await db.query(query, values);

                  if (result.rowCount === 0) {
                    // No user found
                    return null;
                  }

                  const user = result.rows[0];

                  // Compare the provided password with the hashed password in the database
                  const isPasswordValid = await bcrypt.compare(password, user.password);
                  if (!isPasswordValid) {
                    return null;
                  }

                  // Return user object if authentication is successful
                  return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                  };
                }
                catch (error) {
                  console.error("Error authorizing credentials:", error);
                  return null;
                }
              },
            }),
          ],
          pages:{
            signIn: '/login'
          },
          callbacks: {
            async jwt({ token, User }) {
              // Attach user role to the JWT token
              if (User) {
                token.id = User.id;
                token.role = User.role;
              }
              return token;
            },
            async session({ session, token }) {
              // Attach the role to the session
              if (token) {
                session.user = {
                  ...session.user,
                  id: token.id,
                  role: token.role,
                };
              }
              return session;
            },
          },
          session:{
            strategy: "jwt"
          },
          secret: process.env.NEXTAUTH_SECRET,

};
