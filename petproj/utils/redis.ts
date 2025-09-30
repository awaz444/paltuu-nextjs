import Redis from "ioredis";

// Check if Redis is enabled via environment variable
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Create a resilient Redis client but avoid crashing the process when Redis is down.
// Use lazyConnect so the client doesn't attempt to connect at import time in some environments,
// and limit retries so an unreachable Redis doesn't flood logs.
const redis = REDIS_ENABLED ? new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // reduce retries and keep reasonable reconnect behavior
  maxRetriesPerRequest: 2,
  retryStrategy: (times: number) => {
    // Stop trying after 3 attempts to avoid flooding logs
    if (times > 3) return null;
    return Math.min(times * 100, 1000);
  },
  // do not queue commands forever when Redis is down; let callers handle failures
  enableOfflineQueue: false,
  // don't automatically connect on import — connect on first command
  lazyConnect: true,
  // Add connection timeout
  connectTimeout: 5000,
  commandTimeout: 3000,
}) : null;

// Attach handlers so errors don't become unhandled and crash Node.
if (redis) {
  redis.on("error", (err) => {
    // Keep it non-fatal: log a warning and allow application to continue using fallback caches.
    // Only log unique errors to avoid spam
    const errorKey = (err as any).code || err.message?.substring(0, 50) || 'unknown';
    if (!(redis as any)._lastErrorKey || (redis as any)._lastErrorKey !== errorKey) {
      console.warn("[ioredis] Redis error (non-fatal):", errorKey);
      (redis as any)._lastErrorKey = errorKey;
    }
  });

  redis.on("connect", () => {
    console.info("[ioredis] connecting to Redis...");
    (redis as any)._lastErrorKey = null; // Reset error tracking
  });

  redis.on("ready", () => {
    console.info("[ioredis] connected and ready");
  });

  redis.on("close", () => {
    console.info("[ioredis] connection closed");
  });

  redis.on("reconnecting", () => {
    console.info("[ioredis] attempting to reconnect");
  });
}

// Safe Redis wrapper that handles null redis instance
export const safeRedis = {
  async get(key: string): Promise<string | null> {
    if (!redis) return null;
    try {
      return await redis.get(key);
    } catch (e) {
      console.warn("[ioredis] GET failed:", e instanceof Error ? e.message : e);
      return null;
    }
  },

  async set(key: string, value: string, mode?: string, duration?: number): Promise<boolean> {
    if (!redis) return false;
    try {
      if (mode === 'EX' && duration) {
        await redis.set(key, value, 'EX', duration);
      } else {
        await redis.set(key, value);
      }
      return true;
    } catch (e) {
      console.warn("[ioredis] SET failed:", e instanceof Error ? e.message : e);
      return false;
    }
  },

  async del(...keys: string[]): Promise<number> {
    if (!redis || keys.length === 0) return 0;
    try {
      return await redis.del(...keys);
    } catch (e) {
      console.warn("[ioredis] DEL failed:", e instanceof Error ? e.message : e);
      return 0;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    if (!redis) return [];
    try {
      return await redis.keys(pattern);
    } catch (e) {
      console.warn("[ioredis] KEYS failed:", e instanceof Error ? e.message : e);
      return [];
    }
  }
};

export default redis;
