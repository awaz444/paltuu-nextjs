import RedisIoredis, { Redis as IORedisClient } from "ioredis";
import { Redis as UpstashRedis } from "@upstash/redis";

// Upstash detection: support both env var names used by different examples
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REST_URL || "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REST_TOKEN || "";
const USE_UPSTASH = !!UPSTASH_URL && !!UPSTASH_TOKEN;

// If Upstash is configured, use its HTTP client (serverless-friendly). Otherwise fall back to ioredis if enabled.
let upstash: UpstashRedis | null = null;
if (USE_UPSTASH) {
  try {
    upstash = new UpstashRedis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
    console.info('[redis] Using Upstash Redis (HTTP)');
  } catch (e) {
    console.warn('[redis] Failed to initialize Upstash client', e);
    upstash = null;
  }
}

// Local ioredis (optional)
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';
let ioredis: IORedisClient | null = null;
if (!USE_UPSTASH && REDIS_ENABLED) {
  ioredis = new RedisIoredis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 2,
    connectTimeout: 5000,
  });

  ioredis.on('error', (err: any) => {
    console.warn('[ioredis] error (non-fatal):', (err as any)?.message || err);
  });
}

// Safe Redis wrapper used by the application
export const safeRedis = {
  async get(key: string): Promise<string | null> {
    try {
      if (upstash) {
        const data = await upstash.get(key);
        // Upstash returns parsed data, we need to stringify it for consistency
        return data ? JSON.stringify(data) : null;
      }
      if (ioredis) {
        return await ioredis.get(key);
      }
      return null;
    } catch (e) {
      console.warn('[safeRedis] GET failed:', e instanceof Error ? e.message : e);
      return null;
    }
  },

  async set(key: string, value: string, mode?: 'EX', duration?: number): Promise<boolean> {
    try {
      if (upstash) {
        if (mode === 'EX' && duration) {
          await upstash.set(key, value, { ex: duration });
        } else {
          await upstash.set(key, value);
        }
        return true;
      }
      if (ioredis) {
        if (mode === 'EX' && duration) {
          await ioredis.set(key, value, 'EX', duration);
        } else {
          await ioredis.set(key, value);
        }
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[safeRedis] SET failed:', e instanceof Error ? e.message : e);
      return false;
    }
  },

  async del(...keys: string[]): Promise<number> {
    try {
      if (!keys || keys.length === 0) return 0;
      if (upstash) {
        return (await upstash.del(...keys)) as number;
      }
      if (ioredis) {
        return await ioredis.del(...keys);
      }
      return 0;
    } catch (e) {
      console.warn('[safeRedis] DEL failed:', e instanceof Error ? e.message : e);
      return 0;
    }
  },

  async keys(pattern: string): Promise<string[]> {
    try {
      if (upstash) {
        return (await upstash.keys(pattern)) as string[];
      }
      if (ioredis) {
        return await ioredis.keys(pattern);
      }
      return [];
    } catch (e) {
      console.warn('[safeRedis] KEYS failed:', e instanceof Error ? e.message : e);
      return [];
    }
  }
};

// For backward compatibility (some modules import default), export default the active client
export default (upstash as any) || (ioredis as any) || null;
