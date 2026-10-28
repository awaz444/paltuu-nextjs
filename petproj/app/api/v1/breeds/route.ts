import { db } from "@/db/index";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/breeds:
 *   get:
 *     summary: Active breeds, in the order to show them (V1)
 *     description: The picked breed list (PALTU-70). Only species with at least one breed here can be listed for adoption.
 *     tags: [v1 Pets]
 */

let breedsCache: any[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET() {
    try {
        const now = Date.now();
        if (breedsCache && now - lastFetch < CACHE_TTL) {
            return NextResponse.json(breedsCache);
        }

        const result = await db.query(
            `SELECT breed_id, category_id, name, slug, kind, parent_breed_id
             FROM breeds WHERE is_active = true
             ORDER BY category_id, sort_order, name`
        );
        breedsCache = result.rows;
        lastFetch = now;

        return NextResponse.json(breedsCache);
    } catch (error) {
        console.error("V1 Breeds Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
