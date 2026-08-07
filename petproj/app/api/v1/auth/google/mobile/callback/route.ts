import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db/index";
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/auth/google/mobile/callback
 *
 * Google redirects here after the user consents.
 * We exchange the code for tokens, look up/create the user,
 * generate a mobile JWT, then deep-link back to the app:
 *   paltuu://oauth2redirect?token=<accessToken>&refreshToken=<refreshToken>
 *
 * The in-app browser (expo-web-browser openAuthSessionAsync) intercepts the
 * paltuu:// deep link and returns control to the React Native app.
 */
export async function GET(req: NextRequest) {
  let baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  if (!baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
    baseUrl = baseUrl.replace(/^http:/, 'https:');
  }
  const redirectUri = `${baseUrl}/api/v1/auth/google/mobile/callback`;

  let deepLinkBase = 'paltuu://oauth2redirect';

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const state = searchParams.get('state');

    if (state) {
      deepLinkBase = decodeURIComponent(state);
    }

    if (error || !code) {
      const msg = encodeURIComponent(error || 'Google sign-in was cancelled');
      console.error('[Mobile Google Callback] Error from Google:', error);
      return NextResponse.redirect(`${deepLinkBase}?error=${msg}`);
    }

    // 1. Exchange authorization code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[Mobile Google Callback] Token exchange failed:', errBody);
      return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('Token exchange failed')}`);
    }

    const tokenData = await tokenResponse.json();

    // 2. Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoResponse.ok) {
      console.error('[Mobile Google Callback] Failed to fetch user info');
      return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('Failed to fetch user info')}`);
    }

    const googleUser = await userInfoResponse.json();
    const email: string = googleUser.email;
    const name: string = googleUser.name || 'Google User';
    const picture: string | null = googleUser.picture || null;
    const oauthId: string | null = googleUser.sub || null;

    if (!email) {
      return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('No email returned from Google')}`);
    }

    // 3. Find or create the user in your DB (mirrors web NextAuth jwt callback)
    let userResult = await db.query(
      'SELECT user_id, name, email, role, profile_image_url, phone_number, is_suspended FROM users WHERE email = $1',
      [email]
    );

    let user;
    const isNewUser = (userResult.rowCount ?? 0) === 0;

    if (isNewUser) {
      console.log(`[Mobile Google Callback] Auto-registering new Google user: ${email}`);
      const username = email.split('@')[0];
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const newUserResult = await db.query(
        `INSERT INTO users (username, name, email, password, role, profile_image_url, oauth_provider, oauth_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING user_id, name, email, role, profile_image_url, phone_number`,
        [username, name, email, placeholderPassword, 'regular user', picture, 'google', oauthId]
      );
      user = newUserResult.rows[0];

      // 3b. Create Default "All Posts" Collection
      await db.query(
        'INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
        [user.user_id, 'All Posts', true]
      );
    } else {
      user = userResult.rows[0];
    }

    if (user.is_suspended) {
      return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('This account has been suspended for violating our Community Guidelines.')}`);
    }

    // 4. Generate mobile JWT tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    console.log(`[Mobile Google Callback] ✅ Authenticated user ${email} (id: ${user.user_id})`);

    // 5. Deep-link back with tokens + full user info so the app needs no extra API call
    const params = new URLSearchParams({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: String(user.user_id),
      name: user.name,
      email: user.email,
      role: user.role || 'regular user',
      isNewUser: String(isNewUser),
      ...(user.profile_image_url ? { profile_image_url: user.profile_image_url } : {}),
    });
    return NextResponse.redirect(`${deepLinkBase}?${params.toString()}`);

  } catch (error) {
    console.error('[Mobile Google Callback] Unhandled error:', error);
    return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
  }
}
