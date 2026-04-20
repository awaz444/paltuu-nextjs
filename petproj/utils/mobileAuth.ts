import jwt from 'jsonwebtoken';
import { db } from '@/db/index';

const ACCESS_TOKEN_EXPIRY = '60m'; // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '90d'; // Long-lived refresh token

export interface MobileJWTPayload {
  user_id: number;
  email: string;
  role: string | null;
}

/**
 * Generate a pair of tokens for the mobile app
 */
export async function generateMobileTokenPair(user: { user_id: number; email: string; role: string | null }) {
  const accessSecret = process.env.TOKEN_SECRET!;
  const refreshSecret = process.env.REFRESH_TOKEN_SECRET || accessSecret;

  const payload: MobileJWTPayload = {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, accessSecret, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ user_id: user.user_id }, refreshSecret, { expiresIn: REFRESH_TOKEN_EXPIRY });

  // Save refresh token to DB
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 90);

  await db.query(
    'INSERT INTO mobile_refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
    [user.user_id, refreshToken, expiresAt]
  );

  return { accessToken, refreshToken };
}

/**
 * Verify a mobile JWT
 */
export function verifyMobileToken(token: string) {
  try {
    const secret = process.env.TOKEN_SECRET!;
    return jwt.verify(token, secret) as MobileJWTPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Verify a mobile refresh token signature
 */
export function verifyMobileRefreshToken(token: string) {
  try {
    const secret = process.env.REFRESH_TOKEN_SECRET || process.env.TOKEN_SECRET!;
    return jwt.verify(token, secret) as { user_id: number };
  } catch (error) {
    return null;
  }
}

/**
 * Invalidate a mobile refresh token
 */
export async function invalidateMobileRefreshToken(token: string) {
  await db.query('DELETE FROM mobile_refresh_tokens WHERE token = $1', [token]);
}

/**
 * Verify if a refresh token exists and is valid
 */
export async function verifyRefreshTokenInDb(token: string) {
  const result = await db.query(
    'SELECT user_id FROM mobile_refresh_tokens WHERE token = $1 AND expires_at > NOW()',
    [token]
  );

  if (result.rowCount === 0) return null;
  return result.rows[0].user_id as number;
}
