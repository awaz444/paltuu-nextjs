import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../../adminAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/catalogue/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const productRes = await db.query(`SELECT * FROM bazaar_products WHERE product_id = $1`, [params.id]);
        if ((productRes.rowCount ?? 0) === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        const variantsRes = await db.query(`SELECT * FROM bazaar_product_variants WHERE product_id = $1 ORDER BY sort_order ASC`, [params.id]);
        const mediaRes = await db.query(`SELECT * FROM bazaar_product_media WHERE product_id = $1 ORDER BY ordering ASC`, [params.id]);

        return NextResponse.json({ ...productRes.rows[0], variants: variantsRes.rows, media: mediaRes.rows });

    } catch (error: any) {
        console.error("Admin Catalogue Single GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// PUT /api/v1/admin/catalogue/:id
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const allowedFields = ['title', 'description', 'brand', 'animal_type', 'shipping_weight', 'min_order_qty', 'max_order_qty', 'status', 'slug'];
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
            `UPDATE bazaar_products SET ${setClause.join(', ')}, updated_at = NOW() WHERE product_id = $1 RETURNING *`,
            values
        );
        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        return NextResponse.json(result.rows[0]);

    } catch (error: any) {
        console.error("Admin Catalogue Single PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// DELETE /api/v1/admin/catalogue/:id — soft archive
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(
            `UPDATE bazaar_products SET status = 'archived', updated_at = NOW() WHERE product_id = $1 RETURNING *`,
            [params.id]
        );
        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Product not found" }, { status: 404 });

        return NextResponse.json({ success: true, product: result.rows[0] });

    } catch (error: any) {
        console.error("Admin Catalogue DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
