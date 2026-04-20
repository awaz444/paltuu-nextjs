import { Pool } from 'pg';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// ─────────────────────────────────────────────────────────────────────────────
// AWS RDS PostgreSQL Connection Pool
// ─────────────────────────────────────────────────────────────────────────────
// AWS RDS does NOT have a built-in connection pooler (unlike Supabase which
// has PgBouncer). This Pool must be a singleton and carefully sized.
//
// RDS connection limits by instance type (approximate):
//   db.t3.micro   → ~85 connections
//   db.t3.small   → ~170 connections
//   db.t3.medium  → ~340 connections
//
// Keep `max` well below the RDS limit to leave headroom for admin tools,
// migrations, and multiple app instances (e.g. if you run 2 Node processes).
// ─────────────────────────────────────────────────────────────────────────────

const connectionString = process.env.NEW_DATABASE_URL;

if (!connectionString) {
    throw new Error('NEW_DATABASE_URL environment variable is not set.');
}

// Singleton: share the pool across the entire Node.js process lifetime.
// In Next.js dev mode the module cache can be cleared on hot-reload, so we
// attach the pool to `globalThis` as a fallback.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
    const pool = new Pool({
        connectionString,

        // ── SSL ──────────────────────────────────────────────────────────────
        // AWS RDS requires SSL. rejectUnauthorized: false accepts the
        // self-signed RDS cert without needing to bundle the CA cert.
        ssl: { rejectUnauthorized: false },

        // ── Connection count ─────────────────────────────────────────────────
        // Set to a safe fraction of your RDS instance limit.
        // Increase when you upgrade your RDS instance tier.
        max: 10,

        // ── Idle connection cleanup ───────────────────────────────────────────
        // Release connections that have been idle longer than 30 seconds.
        // This prevents stale connections from being killed by the RDS idle
        // connection timeout (default 8 hours, but AWS NAT Gateway drops
        // idle TCP connections after ~350 seconds).
        idleTimeoutMillis: 30_000,

        // ── Connection acquisition timeout ───────────────────────────────────
        // If a free connection is not available from the pool within 5 seconds,
        // throw an error instead of waiting indefinitely.
        connectionTimeoutMillis: 5_000,

        // ── Per-query timeout ────────────────────────────────────────────────
        // Kill any individual query that runs longer than 10 seconds.
        // Protects against runaway queries starving the pool.
        statement_timeout: 10_000,

        // ── TCP keep-alive ───────────────────────────────────────────────────
        // Sends a keep-alive packet every 10 seconds. This prevents AWS NAT
        // Gateway from silently dropping idle TCP connections, which causes
        // "Connection terminated unexpectedly" errors without keep-alive.
        keepAlive: true,
        keepAliveInitialDelayMillis: 10_000,
    });

    pool.on('error', (err) => {
        // Log but don't crash — the pool will automatically create a new
        // connection on the next request.
        console.error('[db] Unexpected error on idle client:', err.message);
    });

    pool.on('connect', () => {
        if (process.env.NODE_ENV !== 'production') {
            console.log(`[db] New connection established (pool size: ${pool.totalCount})`);
        }
    });

    return pool;
}

export const db: Pool = globalForPool.pgPool ?? createPool();

// Store on globalThis in all environments (not just dev) so the singleton
// survives Next.js module re-evaluation during development hot-reloads.
if (!globalForPool.pgPool) {
    globalForPool.pgPool = db;
}

// Convenience helper to run queries directly on the pool without checking out a client.
// Best for single-statement queries. For transactions, use createClient().
export const query = (text: string, params?: unknown[]) => db.query(text, params as any);

// ─────────────────────────────────────────────────────────────────────────────
// createClient() — backwards-compatible helper
// ─────────────────────────────────────────────────────────────────────────────
// Many existing route handlers call:
//   const client = createClient();
//   await client.connect();
//   await client.query(...);
//   await client.end();
//
// This wraps the shared pool so those routes work without changes.
// connect() checks out a dedicated client from the pool (useful for
// multi-statement transactions). end() releases it back.
// ─────────────────────────────────────────────────────────────────────────────
export function createClient() {
    let poolClient: Awaited<ReturnType<Pool['connect']>> | null = null;

    return {
        async connect() {
            if (!poolClient) {
                poolClient = await db.connect();
            }
        },
        async query(text: string, params?: unknown[]) {
            if (poolClient) {
                return poolClient.query(text, params as any);
            }
            return db.query(text, params as any);
        },
        async end() {
            if (poolClient) {
                poolClient.release();
                poolClient = null;
            }
        },
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// Supabase client — kept for Cloudinary/Storage operations only
// The database is now fully on AWS RDS; Supabase is only used for file storage.
// ─────────────────────────────────────────────────────────────────────────────
function normalizeSupabaseUrl(raw?: string): string | undefined {
    if (!raw) return undefined;
    try {
        const parsed = new URL(raw);
        const host = parsed.hostname.replace('.storage.supabase.co', '.supabase.co');
        const pathname = parsed.pathname.includes('/storage') ? '' : parsed.pathname;
        return `${parsed.protocol}//${host}${pathname === parsed.pathname ? '' : ''}`;
    } catch {
        return raw;
    }
}

const SUPABASE_URL = normalizeSupabaseUrl(process.env.SUPABASE_URL);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabase =
    SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
        ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        : null;

