import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/vendors/me
 * Fetch the vendor profile for the currently authenticated user
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const result = await db.query(`
            SELECT v.*, u.email as user_email, u.name as user_name
            FROM vendors v
            JOIN users u ON v.user_id = u.user_id
            WHERE v.user_id = $1
        `, [userId]);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vendors ME GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PUT /api/v1/vendors/me
 * Update vendor profile settings (Delivery, Shop Info, Status)
 */
export async function PUT(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const allowedUpdates = [
            'shop_name', 'address', 'area', 'city_id', 
            'contact_number', 'whatsapp_number', 'logo_url',
            'delivery_polygon', 'flat_delivery_fee', 'per_kg_delivery_fee',
            'max_delivery_weight_kg', 'free_delivery_threshold', 'is_active'
        ];

        const setClause: string[] = [];
        const params: any[] = [userId];

        Object.keys(body).forEach((key) => {
            if (allowedUpdates.includes(key)) {
                params.push(body[key]);
                setClause.push(`${key} = $${params.length}`);
            }
        });

        if (setClause.length === 0) {
            return NextResponse.json({ error: "No valid updates provided" }, { status: 400 });
        }

        const query = `
            UPDATE vendors 
            SET ${setClause.join(', ')}, updated_at = NOW() 
            WHERE user_id = $1 
            RETURNING *
        `;

        const result = await db.query(query, params);

        if ((result.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);

    } catch (error) {
        console.error("V1 Vendors ME PUT error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
