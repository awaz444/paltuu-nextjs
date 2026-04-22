import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/vendors
 * List all active/verified vendors
 */
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city_id = searchParams.get('city_id');
        const area = searchParams.get('area');

        let query = `
            SELECT vendor_id, shop_name, logo_url, area, city_id, is_verified, created_at
            FROM vendors 
            WHERE is_active = true
        `;
        const params: any[] = [];

        if (city_id) {
            params.push(city_id);
            query += ` AND city_id = $${params.length}`;
        }

        if (area) {
            params.push(`%${area}%`);
            query += ` AND area ILIKE $${params.length}`;
        }

        query += ` ORDER BY created_at DESC`;

        const result = await db.query(query, params);
        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Vendors GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/vendors
 * Register a new vendor profile for the authenticated user
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { 
            shop_name, address, area, city_id, 
            contact_number, whatsapp_number, logo_url 
        } = body;

        if (!shop_name || !address) {
            return NextResponse.json({ error: "Shop name and address are required" }, { status: 400 });
        }

        // Check if user already has a vendor profile
        const existing = await db.query("SELECT vendor_id FROM vendors WHERE user_id = $1", [user.id]);
        if ((existing.rowCount ?? 0) > 0) {
            return NextResponse.json({ error: "User already has a vendor profile" }, { status: 400 });
        }

        // Create Vendor Profile
        const query = `
            INSERT INTO vendors (
                user_id, shop_name, address, area, city_id, 
                contact_number, whatsapp_number, logo_url,
                is_active, is_verified
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, false)
            RETURNING *
        `;

        const result = await db.query(query, [
            user.id, shop_name, address, area, city_id,
            contact_number, whatsapp_number, logo_url
        ]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error("V1 Vendors POST error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
