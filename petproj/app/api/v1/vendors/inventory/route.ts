import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * Helper to get vendor_id from authenticated user
 */
async function getVendorId(userId: string) {
    const res = await db.query("SELECT vendor_id FROM vendors WHERE user_id = $1", [userId]);
    return res.rows[0]?.vendor_id;
}

/**
 * GET /api/v1/vendors/inventory
 * Fetch the inventory list for the authenticated vendor
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vendorId = await getVendorId(userId);
        if (!vendorId) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

        const result = await db.query(`
            SELECT 
                vi.*,
                p.title as catalogue_title, p.price as catalogue_price,
                p.sku as catalogue_sku,
                (SELECT url FROM bazaar_product_media WHERE product_id = p.product_id LIMIT 1) as catalogue_image
            FROM vendor_inventory vi
            LEFT JOIN bazaar_products p ON vi.product_id = p.product_id
            WHERE vi.vendor_id = $1
            ORDER BY vi.created_at DESC
        `, [vendorId]);

        return NextResponse.json(result.rows);

    } catch (error) {
        console.error("V1 Inventory GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/vendors/inventory
 * Add a new item to vendor inventory (Catalogue link or Custom)
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const vendorId = await getVendorId(userId);
        if (!vendorId) return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });

        const body = await req.json();
        const { 
            product_id, custom_title, custom_sku, custom_image_url,
            selling_price, original_price, discount_percent = 0,
            stock_count, is_available = true
        } = body;

        if (!selling_price) {
            return NextResponse.json({ error: "Selling price is required" }, { status: 400 });
        }

        // If product_id is provided, check for existing entry for this vendor
        if (product_id) {
            const existing = await db.query(
                "SELECT inventory_id FROM vendor_inventory WHERE vendor_id = $1 AND product_id = $2",
                [vendorId, product_id]
            );
            if ((existing.rowCount ?? 0) > 0) {
                return NextResponse.json({ error: "Product already in inventory. Use PATCH to update." }, { status: 400 });
            }
        }

        const query = `
            INSERT INTO vendor_inventory (
                vendor_id, product_id, custom_title, custom_sku, custom_image_url,
                selling_price, original_price, discount_percent,
                stock_count, is_available
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const result = await db.query(query, [
            vendorId, product_id || null, custom_title, custom_sku, custom_image_url,
            selling_price, original_price || null, discount_percent,
            stock_count || null, is_available
        ]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error("V1 Inventory POST error:", error);
        return NextResponse.json({ 
            error: error instanceof Error ? error.message : "Internal Server Error" 
        }, { status: 500 });
    }
}
