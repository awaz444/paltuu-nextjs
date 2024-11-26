import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = ['/login', '/signup'].includes(pathname);

  // Get the token from cookies
  const token = request.cookies.get('token')?.value;

  // If user is authenticated and trying to access a public path, redirect to profile
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/profile', request.nextUrl));
  }

  // If user is not authenticated and trying to access a protected path, redirect to login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Allow access to the requested path
  return NextResponse.next();
}

// Apply middleware to specific routes
export const config = {
  matcher: ['/', '/profile', '/login'],
};
