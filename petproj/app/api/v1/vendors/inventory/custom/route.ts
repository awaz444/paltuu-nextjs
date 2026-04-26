import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../../vendorAuth";

export const dynamic = "force-dynamic";

// POST /api/v1/vendors/inventory/custom
export async function POST(req: NextRequest) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;
        const body = await req.json();
        const { custom_title, custom_sku, custom_description, custom_image_url, selling_price, original_price, discount_percent = 0, stock_count = null } = body;

        if (!custom_title || selling_price === undefined) {
            return NextResponse.json({ error: "custom_title and selling_price are required" }, { status: 400 });
        }

        const result = await db.query(
            `INSERT INTO vendor_inventory (
                vendor_id, product_id, custom_title, custom_sku, custom_description, custom_image_url,
                selling_price, original_price, discount_percent, stock_count, is_available, created_at, updated_at
            ) VALUES ($1, NULL, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW()) RETURNING *`,
            [vendorId, custom_title, custom_sku || null, custom_description || null, custom_image_url || null, selling_price, original_price || null, discount_percent, stock_count]
        );

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error: any) {
        console.error("Vendor Inventory Custom POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
