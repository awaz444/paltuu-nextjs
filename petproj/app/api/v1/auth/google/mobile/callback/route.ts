import { NextResponse, NextRequest } from "next/server";
import { db } from "@/db/index";
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import bcrypt from "bcryptjs";

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
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/v1/auth/google/mobile/callback`;

  // Build the deep link prefix — works in both Expo Go (exp://) and standalone (paltuu://)
  // The RN app uses Linking.createURL('oauth2redirect') which matches this scheme
  const appScheme = 'paltuu';
  const deepLinkBase = `${appScheme}://oauth2redirect`;

  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const error = searchParams.get('error');

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

    if (!email) {
      return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('No email returned from Google')}`);
    }

    // 3. Find or create the user in your DB
    let userResult = await db.query(
      'SELECT user_id, name, email, role FROM users WHERE email = $1',
      [email]
    );

    let user;

    if ((userResult.rowCount ?? 0) === 0) {
      console.log(`[Mobile Google Callback] Auto-registering new Google user: ${email}`);
      const username = email.split('@')[0];
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);

      const newUserResult = await db.query(
        'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role',
        [username, name, email, placeholderPassword, 'regular user']
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

    // 4. Generate mobile JWT tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role,
    });

    console.log(`[Mobile Google Callback] ✅ Authenticated user ${email} (id: ${user.user_id})`);

    // 5. Deep-link back to the app with the access token
    const deepLink = `${deepLinkBase}?token=${encodeURIComponent(tokens.accessToken)}&refreshToken=${encodeURIComponent(tokens.refreshToken)}`;
    return NextResponse.redirect(deepLink);

  } catch (error) {
    console.error('[Mobile Google Callback] Unhandled error:', error);
    return NextResponse.redirect(`${deepLinkBase}?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
  }
}
