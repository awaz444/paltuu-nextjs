import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Retrieve the database connection string from environment variables
const connectionString: string | undefined = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set.");
}

console.log("DB string: ", connectionString);

export function createClient(): Client {
    return new Client({
        connectionString,
    });
}

export const db: Client = createClient();

db.connect()
    .then(() => console.log("Connected to the database successfully"))
    .catch((err) => {
        console.error("Error connecting to the database:", err);
        throw err;
    });
