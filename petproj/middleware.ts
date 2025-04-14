import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Define public paths that don't require authentication
  const isPublicPath = ['/login', '/sign-up', '/browse-pets', '/foster-pets', '/pet-care', '/llm', '/forgot-password', '/reset-password'].includes(pathname);

  // Define admin-only paths
  const adminOnlyPaths = [
    '/admin-panel',
    '/admin-approve-vets',
    '/admin-pet',
    '/admin-pet-approval',
    '/admin-user'
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
        const [headerB64, payloadB64] = customAuthToken.split('.');
        const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
        if (payload.role !== 'admin') {
          return NextResponse.redirect(new URL('/browse-pets', request.url));
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    if (!isAdmin && !customAuthToken) {
      return NextResponse.redirect(new URL('/browse-pets', request.url));
    }
  }

  if (!isAuthenticated && !isPublicPath) {
    const callbackUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
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
    '/admin-user'
  ]
};