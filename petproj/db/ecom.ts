import { Client, Pool } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the database connection string from environment variables
const connectionStringRaw = process.env.ECOM_DATABASE_URL;

if (!connectionStringRaw) {
    throw new Error("DATABASE_URL environment variable is not set.");
}

// narrow to string for TypeScript
const connectionString: string = connectionStringRaw;

console.log("ECOM DB string: ", connectionString);

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
let pool: Pool | null = null;

export function getPool(): Pool {
    if (!pool) {
        pool = new Pool(poolConfig);

        pool.on('error', (err) => {
            console.error('[Pool] Unexpected error on idle client', err);
        });

        pool.on('connect', () => {
            console.log('[Pool] New client connected');
        });

        console.log('[Pool] Connection pool created');
    }
    return pool;
}

// For backward compatibility - but prefer using getPool() for API routes
export function createClient(): Client {
    // Configure SSL when connecting to Supabase (or when explicitly requested).
    // Supabase Postgres requires TLS; Node's TLS validation may fail in some envs,
    // so we set `rejectUnauthorized: false` by default for supabase.co hosts.
    const clientConfig: any = { connectionString };

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
