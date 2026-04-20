import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import jwt from 'jsonwebtoken';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  // Allow guest checkout and order confirmation without login
  const publicPaths = [
    '/auth',
    '/sign-up',
    '/browse-pets',
    '/foster-pets',
    '/pet-care',
    '/llm',
    '/forgot-password',
    '/reset-password',
    '/checkout',
    '/order-confirmed',
    '/bazaar',
    '/lost-and-found',
    '/shelters',
    '/shops',
    '/about-us',
    '/terms-and-conditions',
    '/privacy-policy',
    '/shipping-policy',
    '/refund&return-policy',
    '/',
  ];

  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/api/');

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

  if (pathname === '/api/users/logout') {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const customAuthToken = request.cookies.get('token')?.value;

  const isAuthenticated = !!token || !!customAuthToken;

  if (isAdminPath) {
    const isAdmin = token?.role === 'admin';

    if (!isAdmin && customAuthToken) {
      try {
        // Verify signature properly using the server secret
        const decoded = jwt.verify(customAuthToken, process.env.TOKEN_SECRET!) as { role?: string };
        if (decoded.role !== 'admin') {
          return NextResponse.redirect(new URL('/browse-pets', request.url));
        }
      } catch (error) {
        console.warn('⚠️ [Middleware] Admin JWT verification failed:', error instanceof Error ? error.message : error);
        return NextResponse.redirect(new URL('/auth', request.url));
      }
    }

    if (!isAdmin && !customAuthToken) {
      return NextResponse.redirect(new URL('/auth', request.url));
    }
  }

  if (!isAuthenticated && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/auth?callbackUrl=${callbackUrl}`, request.url));
  }

  return NextResponse.next();
}

// Update matcher to include all protected routes
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
    '/checkout',
    '/order-confirmed'
  ]
};