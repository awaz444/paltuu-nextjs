// utils/authServer.ts
// Server-side authentication utilities for API routes
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';

interface JWTPayload {
  id?: number | string;
  user_id?: number | string;
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
}

/**
 * Extract userId from request cookies (server-side)
 * Checks both NextAuth session token and custom JWT token
 */
export async function getUserIdFromRequest(req: NextRequest): Promise<string | null> {
  console.log('🔐 [Server Auth] Extracting userId from request...');

  try {
    // 1. Check Authorization Header (Bearer Token) - Primary for Mobile
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!) as JWTPayload;
        const userId = String(decoded.user_id || decoded.id || decoded.sub || '');
        if (userId) {
          console.log('✅ [Server Auth] Extracted userId from Bearer token:', userId);
          return userId;
        }
      } catch (err) {
        console.warn('⚠️ [Server Auth] Invalid Bearer token:', err instanceof Error ? err.message : err);
      }
    }

    // 2. Check NextAuth session token (for Google OAuth/Web users)
    const nextAuthToken = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (nextAuthToken) {
      const userId = String(nextAuthToken.user_id || nextAuthToken.sub || nextAuthToken.id || '');
      if (userId) {
        console.log('✅ [Server Auth] Extracted userId from NextAuth:', userId);
        return userId;
      }
    }

    // 3. Check custom JWT token cookie (legacy/web)
    const tokenCookie = req.cookies.get('token');
    if (tokenCookie?.value) {
      try {
        const decoded = jwt.verify(tokenCookie.value, process.env.TOKEN_SECRET!) as JWTPayload;
        const userId = String(decoded.id || decoded.user_id || '');
        if (userId) {
          console.log('✅ [Server Auth] Extracted userId from cookie JWT:', userId);
          return userId;
        }
      } catch (jwtError) {
        console.warn('⚠️ [Server Auth] Invalid JWT cookie:', jwtError);
      }
    }

    console.log('❌ [Server Auth] No valid authentication found');
    return null;
  } catch (error) {
    console.error('❌ [Server Auth] Auth extraction error:', error);
    return null;
  }
}

/**
 * Get user details from request (includes email, name, role)
 */
export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  try {
    // Check NextAuth token
    const nextAuthToken = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (nextAuthToken) {
      return {
        id: nextAuthToken.user_id || nextAuthToken.sub || nextAuthToken.id,
        email: nextAuthToken.email,
        name: nextAuthToken.name,
        role: nextAuthToken.role || 'regular user',
      } as JWTPayload;
    }

    // Check custom JWT token
    const tokenCookie = req.cookies.get('token');
    if (tokenCookie?.value) {
      const decoded = jwt.verify(tokenCookie.value, process.env.TOKEN_SECRET!) as JWTPayload;
      return decoded;
    }

    return null;
  } catch (error) {
    console.error('Error getting user from request:', error);
    return null;
  }
}
