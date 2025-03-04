import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = ['/login', '/sign-up', '/browse-pets', '/foster-pets', '/pet-care', '/llm', '/forgot-password', '/reset-password'].includes(pathname);

  // Check if the path is a listing detail page
  // const isListingPage = pathname.startsWith('/browse-pets/') || pathname.startsWith('/foster-pets/');

  // Special handling for logout
  if (pathname === '/api/users/logout') {
    return NextResponse.next();
  }

  // Check for NextAuth session token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // Check for custom auth token in cookies
  const customAuthToken = request.cookies.get('token')?.value;

  // User is authenticated if either token exists
  const isAuthenticated = !!token || !!customAuthToken;

  if (!isAuthenticated && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

// Update matcher to include listing detail pages
export const config = {
  matcher: [
    '/profile',
    '/my-listings',
    '/my-applications',
  ]
};