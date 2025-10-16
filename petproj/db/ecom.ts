import { Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the database connection string from environment variables
const connectionStringRaw = process.env.ECOM_DATABASE_URL;

if (!connectionStringRaw) {
    throw new Error("ECOM_DATABASE_URL environment variable is not set.");
}

// narrow to string for TypeScript
const connectionString: string = connectionStringRaw;

console.log("ECOM DB string: ", connectionString ? '[REDACTED]' : null);

// Connection pool configuration for better performance
const forceSsl = process.env.SUPABASE_DB_SSL === 'true' ||
    connectionString.toLowerCase().includes('supabase.co') ||
    process.env.NODE_ENV === 'production';

const poolConfig: any = {
    connectionString,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 5000, // Timeout for acquiring connection
};

if (forceSsl) {
    poolConfig.ssl = { rejectUnauthorized: false };
}

// Create a connection pool (recommended for serverless/API routes)
const pool = new Pool(poolConfig);

pool.on('error', (err) => {
    console.error('[Pool] Unexpected error on idle client', err);
});

pool.on('connect', () => {
    console.log('[Pool] New client connected');
});

console.log('[Pool] Connection pool created');

export function getPool(): Pool {
    return pool;
}

// Convenience helper to run queries directly
export async function query(text: string, params?: any[]) {
    return pool.query(text, params);
}
