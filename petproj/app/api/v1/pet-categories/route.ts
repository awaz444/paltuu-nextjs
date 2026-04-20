import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/pet-categories:
 *   get:
 *     summary: Get all pet categories (V1)
 *     tags: [v1 Pets]
 */

let categoriesCache: any[] | null = null;
let lastFetch = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function GET(req: NextRequest) {
    try {
        const now = Date.now();
        if (categoriesCache && (now - lastFetch < CACHE_TTL)) {
            return NextResponse.json(categoriesCache);
        }

        const result = await db.query('SELECT * FROM pet_category ORDER BY category_name ASC');
        categoriesCache = result.rows;
        lastFetch = now;

        return NextResponse.json(categoriesCache);
    } catch (error) {
        console.error("V1 Pet Categories Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
