import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../vendorAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/vendors/me
export async function GET(req: NextRequest) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        return NextResponse.json(auth.vendor);

    } catch (error: any) {
        console.error("Vendor Me GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/v1/vendors/me
export async function PUT(req: NextRequest) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;
        const body = await req.json();

        // Vendors cannot update platform_fee_percent, is_active, is_verified — admin only
        const allowedFields = [
            'shop_name', 'address', 'area', 'city_id', 'contact_number',
            'whatsapp_number', 'logo_url', 'flat_delivery_fee',
            'per_kg_delivery_fee', 'max_delivery_weight_kg', 'free_delivery_threshold'
        ];
        const setClause: string[] = [];
        const values: any[] = [vendorId];

        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                values.push(body[key]);
                setClause.push(`${key} = $${values.length}`);
            }
        });

        if (setClause.length === 0) return NextResponse.json({ error: "No updates provided" }, { status: 400 });

        const result = await db.query(
            `UPDATE vendors SET ${setClause.join(', ')}, updated_at = NOW() WHERE vendor_id = $1 RETURNING *`,
            values
        );

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error("Vendor Me PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
