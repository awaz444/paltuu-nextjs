import { NextResponse, NextRequest } from "next/server";

/**
 * GET /api/v1/auth/google/mobile
 *
 * Redirects the mobile app's in-app browser to Google's OAuth consent screen.
 * The redirect_uri points back to this BACKEND (already whitelisted in Google Console),
 * not to the mobile device — avoiding the exp:// URI problem entirely.
 */
export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const baseUrl = process.env.NEXTAUTH_URL?.replace(/\/$/, '') || 'http://localhost:3000';
  const redirectUri = `${baseUrl}/api/v1/auth/google/mobile/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account',
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  console.log('[Mobile Google OAuth] Redirecting to Google with redirect_uri:', redirectUri);

  return NextResponse.redirect(googleAuthUrl);
}
