// whatsapp.ts
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the database connection string from environment variables
const connectionStringRaw = process.env.WTSP_DATABASE_URL;

if (!connectionStringRaw) {
    // throw new Error("WTSP_DATABASE_URL environment variable is not set.");
    console.warn("WTSP_DATABASE_URL environment variable is not set.");
}

// narrow to string for TypeScript
const connectionString: string = connectionStringRaw || "";

console.log("WhatsApp DB string: ", connectionString);

export function createWhatsAppClient(): Client {
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

// export const whatsappDb: Client = createWhatsAppClient();

// whatsappDb.connect()
//     .then(() => console.log("Connected to the WhatsApp database successfully"))
//     .catch((err) => {
//         console.error("Error connecting to the WhatsApp database:", err);
//         throw err;
//     });

// Mock client to prevent build errors and disable functionality for now
export const whatsappDb = {
    connect: async () => console.log("Mock WhatsApp DB connected"),
    query: async () => ({ rows: [] }),
    on: () => {},
    end: async () => {},
} as any;