import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = ['/login', '/signup', '/browse-pets','/foster-pets','/llm'].includes(pathname);

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

  // Redirect authenticated users away from login/signup
  // if (isAuthenticated && isPublicPath) {
  //   return NextResponse.redirect(new URL('/browse-pets', request.url));
  // }

  // Redirect unauthenticated users to login
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Update matcher to include all protected routes
export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/browse-pets',
    '/api/users/logout',
    //aawaiz diddy add all protected routes like this
  ]
};
