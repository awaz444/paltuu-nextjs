import { Client } from 'pg';
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

console.log("DB string: ", connectionString);

export function createClient(): Client {
    // Configure SSL when connecting to Supabase (or when explicitly requested).
    // Supabase Postgres requires TLS; Node's TLS validation may fail in some envs,
    // so we set `rejectUnauthorized: false` by default for supabase.co hosts.
    const clientConfig: any = { connectionString };

    const forceSsl = process.env.SUPABASE_DB_SSL === 'true' ||
        connectionString.toLowerCase().includes('supabase.co') ||
        process.env.NODE_ENV === 'production';

    if (forceSsl) {
        clientConfig.ssl = { rejectUnauthorized: false };
    }

    return new Client(clientConfig);
}

export const db: Client = createClient();

db.connect()
    .then(() => console.log("Connected to the database successfully"))
    .catch((err) => {
        console.error("Error connecting to the database:", err);
        throw err;
    });

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
