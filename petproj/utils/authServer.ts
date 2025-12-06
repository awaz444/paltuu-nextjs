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
  console.log('🔐 [Server Auth] Extracting userId from request cookies...');

  try {
    // Method 1: Check NextAuth session token (for Google OAuth users)
    const nextAuthToken = await getToken({
      req: req as any,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (nextAuthToken) {
      console.log('✅ [Server Auth] Found NextAuth session token');
      const userId = String(nextAuthToken.user_id || nextAuthToken.sub || nextAuthToken.id || '');
      if (userId) {
        console.log('✅ [Server Auth] Extracted userId from NextAuth:', userId);
        return userId;
      }
    }

    // Method 2: Check custom JWT token (for email/password users)
    const tokenCookie = req.cookies.get('token');
    if (tokenCookie?.value) {
      console.log('✅ [Server Auth] Found custom JWT token cookie');
      try {
        const decoded = jwt.verify(tokenCookie.value, process.env.TOKEN_SECRET!) as JWTPayload;
        const userId = String(decoded.id || decoded.user_id || '');
        if (userId) {
          console.log('✅ [Server Auth] Extracted userId from custom JWT:', userId);
          return userId;
        }
      } catch (jwtError) {
        console.warn('⚠️ [Server Auth] Failed to verify custom JWT token:', jwtError);
      }
    } else {
      console.log('ℹ️ [Server Auth] No custom JWT token found in cookies');
    }

    console.log('❌ [Server Auth] No valid authentication token found');
    return null;
  } catch (error) {
    console.error('❌ [Server Auth] Error extracting userId:', error);
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
