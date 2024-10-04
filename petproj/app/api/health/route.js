// pages/api/health.js
import { createClient } from "../../../db/index"; 

export async function GET(req) {
    const client = createClient();

    try {
        await client.connect();
        await client.query("SELECT NOW()"); 
        await client.end();

        return new Response(
            JSON.stringify({ message: "CONNECTED!" }),
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (err) {
        return new Response(
            JSON.stringify({
                message: "Failed",
                error: err.message,
            }),
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
