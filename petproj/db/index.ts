import { Pool } from 'pg';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the database connection string from environment variables
const connectionStringRaw = process.env.NEW_DATABASE_URL;

if (!connectionStringRaw) {
    throw new Error("DATABASE_URL environment variable is not set.");
}

// narrow to string for TypeScript
const connectionString: string = connectionStringRaw;

// Singleton pattern for Pool in Next.js development
// Use a unique key to force recreation if the old pool was shutting down
const globalForPool = globalThis as unknown as { pgPool: Pool | undefined };

export const db: Pool = globalForPool.pgPool || new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

if (process.env.NODE_ENV !== "production") globalForPool.pgPool = db;

// Handle unexpected errors on idle clients
db.on('error', (err) => {
    console.error('Unexpected database error on idle client:', err);
    // Note: Do not throw or process.exit here. The pool will attempt to recreate connections on the next request.
});

// Create client helper function for backwards compatibility
// Now returns a 'virtual client' that delegates to the shared pool.
// .connect() and .end() become safe no-ops, as the pool manages connections automatically.
export function createClient(): any {
    let poolClient: any = null;
    return {
        query: async (text: string, params?: any[]) => {
            if (poolClient) {
                return poolClient.query(text, params);
            }
            return db.query(text, params);
        },
        connect: async () => {
            if (!poolClient) {
                poolClient = await db.connect();
            }
        },
        end: async () => {
            if (poolClient) {
                poolClient.release();
                poolClient = null;
            }
        },
    };
}

// Supabase client for storage operations
const RAW_SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Normalize the URL in case an S3/storage endpoint was provided (e.g.
// https://<project>.storage.supabase.co/storage/v1/s3). The Supabase JS client
// expects the project URL (https://<project>.supabase.co). We'll detect and
// convert common storage endpoints to the project origin.
function normalizeSupabaseUrl(raw?: string) {
    if (!raw) return undefined;
    try {
        const parsed = new URL(raw);
        let host = parsed.hostname;

        // If someone provided the storage subdomain, convert it to project host
        if (host.endsWith('.storage.supabase.co')) {
            host = host.replace('.storage.supabase.co', '.supabase.co');
            return `${parsed.protocol}//${host}`;
        }

        // If the path contains /storage, strip it and return origin
        if (parsed.pathname && parsed.pathname.includes('/storage')) {
            return `${parsed.protocol}//${parsed.hostname}`;
        }

        // Otherwise use the origin as-is
        return parsed.origin;
    } catch (e) {
        // If it's not a valid URL, return the raw value and let the client fail
        return raw;
    }
}

const SUPABASE_URL = normalizeSupabaseUrl(RAW_SUPABASE_URL);

export const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;
