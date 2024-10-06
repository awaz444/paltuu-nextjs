// pages/api/health.ts
import { createClient } from "../../../db/index"; 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect();
        await client.query("SELECT NOW()"); 
        await client.end();

        return NextResponse.json(
            { message: "CONNECTED!" },
            {
                status: 200,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    } catch (err) {
        // Cast error to a generic error type to access message
        const error = err as Error;  
        return NextResponse.json(
            {
                message: "Failed",
                error: error.message,
            },
            {
                status: 500,
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    }
}
