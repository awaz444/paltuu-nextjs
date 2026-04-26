import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../../adminAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/vendors/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorRes = await db.query(
            `SELECT v.*, u.email as owner_email, u.name as owner_name 
             FROM vendors v JOIN users u ON v.user_id = u.user_id WHERE v.vendor_id = $1`,
            [params.id]
        );

        if ((vendorRes.rowCount ?? 0) === 0) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

        return NextResponse.json(vendorRes.rows[0]);

    } catch (error: any) {
        console.error("Admin Vendor Single GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/v1/admin/vendors/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const allowedFields = [
            'shop_name', 'address', 'area', 'city_id', 'contact_number',
            'whatsapp_number', 'logo_url', 'flat_delivery_fee',
            'per_kg_delivery_fee', 'max_delivery_weight_kg',
            'free_delivery_threshold', 'platform_fee_percent',
            'is_active', 'is_verified'
        ];
        const setClause: string[] = [];
        const values: any[] = [params.id];

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

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error("Admin Vendor Single PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
