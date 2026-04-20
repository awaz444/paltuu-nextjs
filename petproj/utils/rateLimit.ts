import { safeRedis } from './redis';

/**
 * A simple rate limiting utility for Next.js API routes using Redis.
 * Useful for auth, OTP, and other sensitive endpoints.
 */
export async function rateLimit(
  key: string, 
  limit: number = 5, 
  windowInSeconds: number = 60
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const fullKey = `ratelimit:${key}`;
  
  try {
    const current = await safeRedis.get(fullKey);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= limit) {
      return {
        success: false,
        limit,
        remaining: 0,
        reset: windowInSeconds, // Simple reset estimate
      };
    }

    // Increment count
    const newCount = count + 1;
    
    // Set with expiration if it's a new key, otherwise just update
    // Note: safeRedis.set handles expiration if 'EX' mode is provided
    await safeRedis.set(fullKey, newCount.toString(), 'EX', windowInSeconds);

    return {
      success: true,
      limit,
      remaining: limit - newCount,
      reset: windowInSeconds,
    };
  } catch (error) {
    console.error('[rateLimit] Error:', error);
    // Fail open if Redis is down, but log the error
    return {
      success: true,
      limit,
      remaining: limit,
      reset: 0,
    };
  }
}
