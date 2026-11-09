import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { safeCallbackUrl } from '@/lib/authRedirect';
import { ORG_HOST_PATTERN } from '@/lib/site';

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

const ORG_HOST = new RegExp(ORG_HOST_PATTERN);

/**
 * Which landing page "/" serves to a signed-out visitor. All three are static
 * pages; picking one here, before the CDN, keeps them static with no flicker
 * and no location prompt.
 * - paltuu.org → app/lp/international
 * - paltuu.pk, visitor in Karachi (Vercel's IP city) → app/lp/karachi, which
 *   leads with Vets at Home (Karachi only for now; see VETS_AT_HOME.city)
 * - everyone else → app/page.tsx
 * The city is a hint from the visitor's IP and is wrong behind a VPN: never use
 * it for anything but this choice. Locally there's no Vercel header or .org
 * host, so try /?city=Karachi (or DEV_GEO_CITY=Karachi) and /?site=org.
 */
function landingPage(request: NextRequest) {
  const dev = process.env.NODE_ENV !== 'production';
  const host = (request.headers.get('host') ?? '').split(':')[0];
  if (ORG_HOST.test(host) || (dev && request.nextUrl.searchParams.get('site') === 'org')) {
    return NextResponse.rewrite(new URL('/lp/international', request.url));
  }

  let city = request.headers.get('x-vercel-ip-city');
  if (city) {
    try {
      city = decodeURIComponent(city);
    } catch {
      /* keep the raw value */
    }
  } else if (dev) {
    city = request.nextUrl.searchParams.get('city') ?? process.env.DEV_GEO_CITY ?? null;
  }

  if (city?.trim().toLowerCase() === 'karachi') {
    return NextResponse.rewrite(new URL('/lp/karachi', request.url));
  }
  return NextResponse.next();
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Signed-in visitors see the feed at "/"; everyone else gets a (static) landing page.
  // Visitors with no auth cookie at all skip the token checks entirely.
  if (pathname === '/') {
    const hasAuthCookie =
      request.cookies.has('token') ||
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token');
    if (hasAuthCookie) {
      const sessionToken = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
      const custom = request.cookies.get('token')?.value;
      const signedIn = !!sessionToken || (custom ? !!(await verifyCustomToken(custom)) : false);
      if (signedIn) return NextResponse.rewrite(new URL('/home', request.url));
    }
    return landingPage(request);
  }

  // The landing variants have no public URL of their own: they are only ever
  // served at "/" (rewrites don't re-run middleware, so this never loops).
  if (pathname === '/lp' || pathname.startsWith('/lp/')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

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
      case 'shop admin':
        return '/shop-panel';
      case 'shelter admin':
        return '/rescue-panel';
      case 'vendor':
        return '/vendor-panel';
      case 'admin':
        return '/admin-panel';
      default:
        return '/home';
    }
  };

  if (pathname === '/auth' && isAuthenticated) {
    // Already signed in: go where they were headed (lib/authRedirect), else
    // their role's landing page.
    const next = safeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'));
    const role = token?.role ?? customAuthPayload?.role;
    return NextResponse.redirect(new URL(next ?? getRoleRedirect(role as string | undefined), request.url));
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
    '/',
    '/lp',
    '/lp/:path*',
    '/auth',
    '/profile',
    '/my-listings',
    '/my-applications',
    '/admin-panel',
    '/admin-pet',
    '/admin-pet-approval',
    '/admin-user',
    '/checkout',
    '/order-confirmed'
  ]
};