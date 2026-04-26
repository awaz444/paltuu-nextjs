import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../vendorAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/vendors/orders
export async function GET(req: NextRequest) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;

        const result = await db.query(`
            SELECT vo.*, 
                o.customer_name, o.customer_email, o.customer_phone, o.shipping_address, o.payment_method, o.notes,
                COALESCE(
                    (SELECT json_agg(oi.*) FROM bazaar_order_items oi WHERE oi.vendor_order_id = vo.vendor_order_id),
                    '[]'::json
                ) as items
            FROM vendor_orders vo
            JOIN bazaar_orders o ON vo.order_id = o.order_id
            WHERE vo.vendor_id = $1
            ORDER BY vo.created_at DESC
        `, [vendorId]);

        return NextResponse.json(result.rows);

    } catch (error: any) {
        console.error("Vendor Orders GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
