import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import AppleProvider from "next-auth/providers/apple";
import CredentialsProvider from "next-auth/providers/credentials";
import appleSignin from "apple-signin-auth";
import { db } from "@/db/index";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";

function buildAppleClientSecret(): string | null {
  const clientID = process.env.APPLE_ID;
  const teamID = process.env.APPLE_TEAM_ID;
  const keyIdentifier = process.env.APPLE_KEY_ID;
  const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientID || !teamID || !keyIdentifier || !privateKey) {
    return null;
  }

  return appleSignin.getClientSecret({
    clientID,
    teamID,
    privateKey,
    keyIdentifier,
  });
}

async function setAppTokenCookie(params: {
  user_id: number | string;
  email: string;
  role: string;
  label: string;
}) {
  try {
    const { generateMobileTokenPair } = require("@/utils/mobileAuth");
    const { cookies } = require("next/headers");
    const tokens = await generateMobileTokenPair({
      user_id: params.user_id,
      email: params.email,
      role: params.role,
    });

    cookies().set("token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    console.log(`[Auth] Set custom JWT token cookie for ${params.label}`);
  } catch (err) {
    console.error(`[Auth] Failed to set custom JWT token for ${params.label}`, err);
  }
}

const appleClientSecret = buildAppleClientSecret();
const appleEnabled = Boolean(process.env.APPLE_ID && appleClientSecret);

const providers: NextAuthOptions["providers"] = [
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
      const normalizedEmail = credentials.email.toString().trim().toLowerCase();
      const rawPassword = credentials.password.toString();

      const res = await db.query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [normalizedEmail]);
      const user = res.rows[0];

      const inputCandidates = Array.from(new Set([rawPassword, rawPassword.trim()]));
      const trimmedRawPassword = rawPassword.trim();
      const emailVariants = Array.from(new Set([normalizedEmail, normalizedEmail.trim(), normalizedEmail.toLowerCase()]));
      const legacyComposedCandidates = emailVariants.flatMap((mail) => [
        `${rawPassword}${mail}`,
        `${mail}${rawPassword}`,
        `${trimmedRawPassword}${mail}`,
        `${mail}${trimmedRawPassword}`,
        `${rawPassword}:${mail}`,
        `${mail}:${rawPassword}`,
        `${trimmedRawPassword}:${mail}`,
        `${mail}:${trimmedRawPassword}`,
      ]);
      const expandedInputCandidates = Array.from(
        new Set([
          ...inputCandidates,
          ...legacyComposedCandidates,
          createHash("sha256").update(rawPassword).digest("hex"),
          createHash("sha256").update(trimmedRawPassword).digest("hex"),
          ...legacyComposedCandidates.map((v) => createHash("sha256").update(v).digest("hex")),
          createHash("md5").update(rawPassword).digest("hex"),
          createHash("md5").update(trimmedRawPassword).digest("hex"),
          ...legacyComposedCandidates.map((v) => createHash("md5").update(v).digest("hex")),
        ])
      );
      const storedPassword = typeof user?.password === "string" ? user.password : "";
      const storedPasswordTrimmed = storedPassword.trim();
      const storedPasswordLower = storedPasswordTrimmed.toLowerCase();
      let isValidPassword = false;
      let matchedInput = rawPassword;
      let didUpgradeHash = false;

      if (storedPasswordTrimmed.startsWith("$2")) {
        const normalizedBcryptHash =
          storedPasswordTrimmed.startsWith("$2y$") || storedPasswordTrimmed.startsWith("$2x$")
            ? `$2b$${storedPasswordTrimmed.slice(4)}`
            : storedPasswordTrimmed;
        for (const candidate of expandedInputCandidates) {
          if (await bcrypt.compare(candidate, normalizedBcryptHash)) {
            isValidPassword = true;
            matchedInput = candidate;
            break;
          }
        }
      } else if (storedPassword) {
        for (const candidate of expandedInputCandidates) {
          const md5Hex = createHash("md5").update(candidate).digest("hex");
          const sha256Hex = createHash("sha256").update(candidate).digest("hex");
          if (
            candidate === storedPassword ||
            candidate === storedPasswordTrimmed ||
            md5Hex === storedPasswordLower ||
            sha256Hex === storedPasswordLower
          ) {
            isValidPassword = true;
            matchedInput = candidate;
            break;
          }
        }

        if (isValidPassword) {
          const upgradedHash = await bcrypt.hash(trimmedRawPassword || rawPassword, 10);
          await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [upgradedHash, user.user_id]);
          didUpgradeHash = true;
        }
      }
      if (!didUpgradeHash && isValidPassword && matchedInput !== rawPassword && matchedInput !== trimmedRawPassword) {
        const upgradedHash = await bcrypt.hash(trimmedRawPassword || rawPassword, 10);
        await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [upgradedHash, user.user_id]);
      }

      if (user && isValidPassword) {
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
];

if (appleEnabled) {
  providers.push(
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: appleClientSecret!,
    })
  );
} else {
  console.warn(
    "[Auth] Apple Sign-In provider not enabled — set APPLE_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY"
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  // Apple uses response_mode=form_post, which posts cross-site to the callback.
  // Lax cookies are dropped on that POST — use SameSite=None for OAuth state cookies.
  ...(appleEnabled
    ? {
        cookies: {
          pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
              maxAge: 60 * 15,
            },
          },
          state: {
            name: "next-auth.state",
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
              maxAge: 60 * 15,
            },
          },
          nonce: {
            name: "next-auth.nonce",
            options: {
              httpOnly: true,
              sameSite: "none" as const,
              path: "/",
              secure: true,
              maxAge: 60 * 15,
            },
          },
        },
      }
    : {}),
  callbacks: {
    async jwt({ token, user, account, profile }) {
      // 1. Initial Login (Credentials, Google, or Apple)
      if (user) {
        token.id = user.id;
        token.user_id = user.id;
        token.role = (user as any).role || "regular user";
      }

      if (account?.provider) {
        token.provider = account.provider;
      }

      // 2. Specialized handling for Google to get the database's integer user_id
      if (account?.provider === "google" && profile?.email) {
        try {
          const googlePicture = (profile as any).picture || null;
          const googleName = profile.name || null;

          let res = await db.query(
            "SELECT user_id, role, name, profile_image_url FROM users WHERE email = $1",
            [profile.email]
          );

          // Auto-register Google users if they don't exist
          if (res.rows.length === 0) {
            console.log(`[Auth] Auto-registering Google user: ${profile.email}`);
            const randomPassword = randomBytes(32).toString("hex");
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            res = await db.query(
              "INSERT INTO users (name, email, password, role, profile_image_url, oauth_provider, oauth_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING user_id, role, name, profile_image_url",
              [
                googleName || "Google User",
                profile.email,
                hashedPassword,
                "regular user",
                googlePicture,
                "google",
                profile.sub,
              ]
            );
          } else {
            // Returning user: backfill oauth + missing name/avatar so navbar stays correct after hydrate
            const existing = res.rows[0];
            const existingImage = existing.profile_image_url as string | null;
            const needsImage =
              !!googlePicture &&
              (!existingImage ||
                existingImage.includes("no-profile") ||
                existingImage.trim() === "");
            const needsName =
              !!googleName && (!existing.name || String(existing.name).trim() === "");

            res = await db.query(
              `UPDATE users SET
                 oauth_provider = 'google',
                 oauth_id = $1,
                 profile_image_url = CASE WHEN $2::boolean THEN $3 ELSE profile_image_url END,
                 name = CASE WHEN $4::boolean THEN $5 ELSE name END
               WHERE user_id = $6
               RETURNING user_id, role, name, profile_image_url`,
              [
                profile.sub,
                needsImage,
                googlePicture,
                needsName,
                googleName,
                existing.user_id,
              ]
            );
          }

          if (res.rows.length > 0) {
            token.id = res.rows[0].user_id;
            token.user_id = res.rows[0].user_id;
            token.role = res.rows[0].role || "regular user";
            if (res.rows[0].name) token.name = res.rows[0].name;
            if (res.rows[0].profile_image_url) token.picture = res.rows[0].profile_image_url;
            console.log(`[Auth] Mapped Google user ${profile.email} to DB ID ${token.id}`);

            await setAppTokenCookie({
              user_id: res.rows[0].user_id,
              email: profile.email,
              role: res.rows[0].role || "regular user",
              label: `Google user ${profile.email}`,
            });
          }
        } catch (dbError) {
          console.error("[Auth] Database error mapping/creating Google user:", dbError);
        }
      }

      // 3. Apple — match mobile lookup order: oauth_id → email link → create
      if (account?.provider === "apple") {
        try {
          const appleSub = (profile as any)?.sub || account.providerAccountId;
          const appleEmail =
            profile?.email ||
            (typeof (profile as any)?.email === "string" ? (profile as any).email : null) ||
            token.email ||
            null;

          if (!appleSub) {
            console.error("[Auth] Apple login missing sub/providerAccountId");
          } else {
            let userRow: { user_id: number; role: string; email: string } | null = null;

            const oauthResult = await db.query(
              "SELECT user_id, role, email FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
              ["apple", appleSub]
            );

            if (oauthResult.rows.length > 0) {
              userRow = oauthResult.rows[0];
            } else if (appleEmail) {
              const emailResult = await db.query(
                "SELECT user_id, role, email FROM users WHERE email = $1",
                [appleEmail]
              );

              if (emailResult.rows.length > 0) {
                userRow = emailResult.rows[0];
                console.log(`[Auth] Linking existing user (${appleEmail}) to Apple OAuth`);
                await db.query(
                  "UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE user_id = $3",
                  ["apple", appleSub, userRow!.user_id]
                );
              } else {
                console.log(`[Auth] Auto-registering Apple user: ${appleEmail}`);
                const randomPassword = randomBytes(32).toString("hex");
                const hashedPassword = await bcrypt.hash(randomPassword, 10);

                const profileName = profile?.name as string | { firstName?: string; lastName?: string; givenName?: string; familyName?: string } | undefined;
                let resolvedName = "Apple User";
                if (typeof profileName === "string" && profileName.trim()) {
                  resolvedName = profileName.trim();
                } else if (profileName && typeof profileName === "object") {
                  const first = profileName.firstName || profileName.givenName || "";
                  const last = profileName.lastName || profileName.familyName || "";
                  resolvedName = `${first} ${last}`.trim() || "Apple User";
                }

                const username = appleEmail.split("@")[0];

                const insertResult = await db.query(
                  `INSERT INTO users (username, name, email, password, role, oauth_provider, oauth_id)
                   VALUES ($1, $2, $3, $4, $5, $6, $7)
                   RETURNING user_id, role, email`,
                  [username, resolvedName, appleEmail, hashedPassword, "regular user", "apple", appleSub]
                );
                userRow = insertResult.rows[0];

                await db.query(
                  "INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
                  [userRow!.user_id, "All Posts", true]
                );
              }
            } else {
              console.error(
                "[Auth] Apple login has no email and no existing oauth link — cannot create user"
              );
            }

            if (userRow) {
              token.id = String(userRow.user_id);
              token.user_id = userRow.user_id;
              token.role = userRow.role || "regular user";
              token.email = userRow.email;
              console.log(`[Auth] Mapped Apple user ${userRow.email} to DB ID ${token.id}`);

              await setAppTokenCookie({
                user_id: userRow.user_id,
                email: userRow.email,
                role: userRow.role || "regular user",
                label: `Apple user ${userRow.email}`,
              });
            }
          }
        } catch (dbError) {
          console.error("[Auth] Database error mapping/creating Apple user:", dbError);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).user_id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).provider = token.provider;
        if (token.name) session.user.name = token.name as string;
        if (token.picture) session.user.image = token.picture as string;
        if (token.email) session.user.email = token.email as string;
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
