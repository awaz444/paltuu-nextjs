import { NextRequest, NextResponse } from 'next/server';
import { safeRedis } from '../../../utils/redis';

// Utility endpoint to clear corrupted Redis cache entries
// Call with: POST /api/clear-cache
export async function POST(req: NextRequest) {
  try {
    const keys = await safeRedis.keys('products:*');
    let cleaned = 0;
    let total = keys.length;

    console.log(`[Cache Cleanup] Found ${total} cache keys to check`);

    for (const key of keys) {
      try {
        const value = await safeRedis.get(key);
        if (!value) continue;

        // Ensure value is a string before calling string methods
        const valueStr = typeof value === 'string' ? value : String(value);

        // Check for corrupted entries
        if (valueStr === '[object Object]' || valueStr.includes('[object Object]')) {
          await safeRedis.del(key);
          cleaned++;
          console.log(`[Cache Cleanup] Deleted corrupted key: ${key}`);
        } else {
          // Try to parse as JSON to verify integrity
          try {
            JSON.parse(valueStr);
          } catch (parseErr) {
            await safeRedis.del(key);
            cleaned++;
            console.log(`[Cache Cleanup] Deleted invalid JSON key: ${key}`);
          }
        }
      } catch (e) {
        // If we can't read the key, delete it
        await safeRedis.del(key);
        cleaned++;
        console.log(`[Cache Cleanup] Deleted unreadable key: ${key}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cache cleanup completed. Checked ${total} keys, cleaned ${cleaned} corrupted entries.`,
      total,
      cleaned
    });

  } catch (error) {
    console.error('[Cache Cleanup] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to clean cache',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}