import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

console.log("DB string: ", connectionString);

export function createClient() {
    return new Client({
        connectionString,
    });
}