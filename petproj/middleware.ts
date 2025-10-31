import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = [
    '/login',
    '/sign-up',
    '/browse-pets',
    '/foster-pets',
    '/pet-care',
    '/llm',
    '/forgot-password',
    '/reset-password',
    '/checkout',
    '/order-confirmed'
  ].includes(pathname);

  // Define admin-only paths
  const adminOnlyPaths = [
    '/admin-panel',
    '/admin-approve-vets',
    '/admin-pet',
    '/admin-pet-approval',
    '/admin-user',
    '/bazaar-admin'
  ];

  const isAdminPath = adminOnlyPaths.includes(pathname);

  // Get NextAuth token
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const isAuthenticated = !!token;

  // Check admin access
  if (isAdminPath) {
    if (!isAuthenticated || token?.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redirect to login if accessing protected route without authentication
  if (!isAuthenticated && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile',
    '/my-listings',
    '/my-applications',
    '/admin-panel',
    '/admin-approve-vets',
    '/admin-pet',
    '/admin-pet-approval',
    '/admin-user',
    '/bazaar-admin',
    '/checkout',
    '/order-confirmed',
    '/vet-panel/:path*',
    '/shop-panel/:path*',
    '/rescue-panel/:path*'
  ]
};