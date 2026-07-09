import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db/index";
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import appleSignin from "apple-signin-auth";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/auth/apple/mobile
 *
 * Verifies the Apple identityToken sent from the native iOS React Native client.
 * If valid, finds/creates the user in the database, generates mobile JWTs,
 * and returns them to the React Native app.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { identityToken, fullName, email } = body;

    if (!identityToken) {
      return NextResponse.json(
        { error: "identityToken is required" },
        { status: 400 }
      );
    }

    const appleClientIds = process.env.APPLE_CLIENT_IDS
      ? process.env.APPLE_CLIENT_IDS.split(",").map((id) => id.trim())
      : ["com.paltuu.app"];

    // 1. Verify the Apple Identity Token (JWT)
    let applePayload;
    try {
      applePayload = await appleSignin.verifyIdToken(identityToken, {
        audience: appleClientIds,
        ignoreExpiration: false,
      });
    } catch (verifyError: any) {
      const decoded = jwt.decode(identityToken) as any;
      console.error("[Mobile Apple Auth] Token verification failed:", verifyError);
      console.error("[Mobile Apple Auth] Decoded token payload was:", decoded);
      return NextResponse.json(
        { 
          error: "Invalid Apple identity token: " + verifyError.message,
          decodedAudience: decoded?.aud
        },
        { status: 400 }
      );
    }

    const { sub, email: appleEmail } = applePayload;
    const resolvedEmail = email || appleEmail;

    if (!resolvedEmail) {
      return NextResponse.json(
        { error: "No email returned from Apple or provided by client." },
        { status: 400 }
      );
    }

    // 2. Find or create the user in the database
    // Step 2a: Lookup by oauth_provider = 'apple' AND oauth_id = sub
    let userResult = await db.query(
      "SELECT user_id, name, email, role, profile_image_url, phone_number FROM users WHERE oauth_provider = $1 AND oauth_id = $2",
      ["apple", sub]
    );

    let user;
    let isNewUser = false;

    if ((userResult.rowCount ?? 0) > 0) {
      user = userResult.rows[0];
    } else {
      // Step 2b: Lookup by email to link existing accounts
      const emailResult = await db.query(
        "SELECT user_id, name, email, role, profile_image_url, phone_number FROM users WHERE email = $1",
        [resolvedEmail]
      );

      if ((emailResult.rowCount ?? 0) > 0) {
        user = emailResult.rows[0];
        console.log(`[Mobile Apple Auth] Linking existing user (${resolvedEmail}) to Apple OAuth`);
        await db.query(
          "UPDATE users SET oauth_provider = $1, oauth_id = $2 WHERE user_id = $3",
          ["apple", sub, user.user_id]
        );
      } else {
        // Step 2c: Register a new user
        isNewUser = true;
        console.log(`[Mobile Apple Auth] Auto-registering new Apple user: ${resolvedEmail}`);

        let resolvedName = "Apple User";
        if (fullName) {
          const first = fullName.givenName || "";
          const last = fullName.familyName || "";
          resolvedName = `${first} ${last}`.trim() || "Apple User";
        }

        const username = resolvedEmail.split("@")[0];
        const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);

        const newUserResult = await db.query(
          `INSERT INTO users (username, name, email, password, role, oauth_provider, oauth_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING user_id, name, email, role, profile_image_url, phone_number`,
          [username, resolvedName, resolvedEmail, placeholderPassword, "regular user", "apple", sub]
        );
        user = newUserResult.rows[0];

        // Create default "All Posts" save collection for the new user
        await db.query(
          "INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING",
          [user.user_id, "All Posts", true]
        );
      }
    }

    // 3. Generate mobile JWT tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    console.log(`[Mobile Apple Auth] ✅ Authenticated user ${user.email} (id: ${user.user_id})`);

    // 4. Return the tokens + user info to client
    return NextResponse.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: String(user.user_id),
      name: user.name,
      email: user.email,
      role: user.role || "regular user",
      isNewUser,
      profile_image_url: user.profile_image_url || null,
    });

  } catch (error) {
    console.error("[Mobile Apple Auth] Unhandled error:", error);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
