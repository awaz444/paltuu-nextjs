import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/cities:
 *   get:
 *     summary: Get all cities (V1)
 *     tags: [v1 Locations]
 */

let citiesCache: any[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
    try {
        const now = Date.now();
        if (citiesCache && (now - lastFetch < CACHE_TTL)) {
            return NextResponse.json(citiesCache);
        }

        const result = await db.query('SELECT * FROM cities ORDER BY city_name ASC');
        citiesCache = result.rows;
        lastFetch = now;
        
        return NextResponse.json(citiesCache);
    } catch (error) {
        console.error("V1 Cities Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
