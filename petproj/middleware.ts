import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

type CustomTokenPayload = {
  role?: string;
  id?: number | string;
  user_id?: number | string;
  sub?: string;
};

function base64UrlToBytes(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function base64UrlFromBytes(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

async function verifyCustomToken(token: string): Promise<CustomTokenPayload | null> {
  const secret = process.env.TOKEN_SECRET;
  if (!secret || !token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;

  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const signature = base64UrlToBytes(encodedSignature);
    const isValid = await crypto.subtle.verify(
      'HMAC',
      key,
      signature,
      new TextEncoder().encode(signingInput)
    );

    if (!isValid) return null;

    const payloadJson = new TextDecoder().decode(base64UrlToBytes(encodedPayload));
    return JSON.parse(payloadJson) as CustomTokenPayload;
  } catch {
    return null;
  }
}

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

  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/api/v1/');

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

  if (pathname === '/api/v1/auth/logout') {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  const customAuthToken = request.cookies.get('token')?.value;
  const customAuthPayload = customAuthToken ? await verifyCustomToken(customAuthToken) : null;

  const isAuthenticated = !!token || !!customAuthPayload;

  const getRoleRedirect = (role?: string | null) => {
    switch (role) {
      case 'vet':
        return '/vet-panel';
      case 'shop admin':
        return '/shop-panel';
      case 'shelter admin':
        return '/rescue-panel';
      case 'vendor':
        return '/vendor-panel';
      case 'admin':
        return '/admin-panel';
      default:
        return '/browse-pets';
    }
  };

  if (pathname === '/auth' && isAuthenticated) {
    if (token?.role) {
      return NextResponse.redirect(new URL(getRoleRedirect(token.role), request.url));
    }

    if (customAuthPayload) {
      return NextResponse.redirect(new URL(getRoleRedirect(customAuthPayload.role), request.url));
    }

    return NextResponse.redirect(new URL('/browse-pets', request.url));
  }

  if (isAdminPath) {
    const isAdmin = token?.role === 'admin';

    if (!isAdmin && customAuthPayload) {
      if (customAuthPayload.role === 'admin') {
        return NextResponse.next();
      }

      return NextResponse.redirect(new URL('/browse-pets', request.url));
    }

    if (!isAdmin && !customAuthPayload) {
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
    '/auth',
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