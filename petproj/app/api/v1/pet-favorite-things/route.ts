import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/pet-favorite-things:
 *   get:
 *     summary: Get all pet favorite things/traits (V1)
 *     tags: [v1 Pets]
 */

let favoritesCache: any[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
    try {
        const now = Date.now();
        if (favoritesCache && (now - lastFetch < CACHE_TTL)) {
            return NextResponse.json(favoritesCache);
        }

        const result = await db.query('SELECT * FROM favorite_things ORDER BY fav_thing_name ASC');
        favoritesCache = result.rows;
        lastFetch = now;

        return NextResponse.json(favoritesCache);
    } catch (error) {
        console.error("V1 Pet Favorite Things Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
