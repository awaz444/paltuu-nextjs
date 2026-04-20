/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: System Health Check
 *     description: Verifies database connectivity and returns server status.
 *     tags: [System]
 */

import { createClient } from "../../../db/index"; 
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const startTime = Date.now();

    try {
        await client.connect();
        const dbResult = await client.query("SELECT NOW() as db_time"); 
        await client.end();

        return NextResponse.json({
            status: "UP",
            database: "CONNECTED",
            timestamp: new Date().toISOString(),
            db_time: dbResult.rows[0].db_time,
            latency_ms: Date.now() - startTime,
            environment: process.env.NODE_ENV
        }, { status: 200 });

    } catch (err) {
        const error = err as Error;  
        return NextResponse.json({
            status: "DOWN",
            database: "ERROR",
            error: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
