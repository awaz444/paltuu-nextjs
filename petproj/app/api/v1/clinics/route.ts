import { NextRequest, NextResponse } from "next/server";
import { queryClinics } from "@/lib/clinicsQuery";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/clinics:
 *   get:
 *     summary: Get paginated clinics with optional filters
 *     tags: [v1 Professional]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter clinics by city (e.g. Karachi, Lahore, Islamabad)
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by clinic category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search clinics by name, address, or city
 *       - in: query
 *         name: verified
 *         schema:
 *           type: boolean
 *         description: Only return verified clinics
 *       - in: query
 *         name: partner
 *         schema:
 *           type: boolean
 *         description: Only return Paltuu partner clinics
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [rating, distance]
 *         description: Sort order — "distance" requires lat/lng
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 15
 *         description: Max 50
 *       - in: query
 *         name: listing_type
 *         schema:
 *           type: string
 *           enum: [clinic, home_vet]
 *         description: Filter by listing type. Omit to return all listings.
 *       - in: query
 *         name: all
 *         schema:
 *           type: boolean
 *         description: Skip pagination and return every matching clinic (e.g. for map pins) — ignores page/limit
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const listingTypeRaw = searchParams.get("listing_type");
        const pageRaw = parseInt(searchParams.get("page") ?? "", 10);
        const limitRaw = parseInt(searchParams.get("limit") ?? "", 10);

        const result = await queryClinics({
            city: searchParams.get("city"),
            category: searchParams.get("category"),
            search: searchParams.get("search"),
            verified: searchParams.get("verified") === "true",
            partner: searchParams.get("partner") === "true",
            sort: searchParams.get("sort"),
            lat: parseFloat(searchParams.get("lat") ?? ""),
            lng: parseFloat(searchParams.get("lng") ?? ""),
            listingType: listingTypeRaw === "clinic" || listingTypeRaw === "home_vet" ? listingTypeRaw : null,
            all: searchParams.get("all") === "true",
            page: Number.isFinite(pageRaw) ? pageRaw : undefined,
            limit: Number.isFinite(limitRaw) ? limitRaw : undefined,
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("V1 Clinics Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
