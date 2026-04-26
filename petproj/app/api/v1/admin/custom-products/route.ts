import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/custom-products
// List all vendor-created custom products
export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(`
            SELECT vi.*, v.shop_name, v.vendor_id
            FROM vendor_inventory vi
            JOIN vendors v ON vi.vendor_id = v.vendor_id
            WHERE vi.product_id IS NULL
            ORDER BY vi.created_at DESC
        `);

        return NextResponse.json(result.rows);

    } catch (error: any) {
        console.error("Admin Custom Products GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
