import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkVendor } from "../../vendorAuth";

export const dynamic = "force-dynamic";

// PUT /api/v1/vendors/inventory/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;
        const body = await req.json();

        const allowedFields = ['selling_price', 'original_price', 'discount_percent', 'is_available', 'stock_count'];
        const setClause: string[] = [];
        const values: any[] = [params.id, vendorId];

        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                values.push(body[key]);
                setClause.push(`${key} = $${values.length}`);
            }
        });

        if (setClause.length === 0) return NextResponse.json({ error: "No updates provided" }, { status: 400 });

        const result = await db.query(
            `UPDATE vendor_inventory SET ${setClause.join(', ')}, updated_at = NOW() WHERE inventory_id = $1 AND vendor_id = $2 RETURNING *`,
            values
        );

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error("Vendor Inventory PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/v1/vendors/inventory/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const auth = await checkVendor(req);
        if (!auth) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const vendorId = auth.vendor.vendor_id;

        const result = await db.query(
            `DELETE FROM vendor_inventory WHERE inventory_id = $1 AND vendor_id = $2 RETURNING *`,
            [params.id, vendorId]
        );

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Vendor Inventory DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
