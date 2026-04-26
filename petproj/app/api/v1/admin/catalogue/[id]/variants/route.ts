import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../../../adminAuth";

export const dynamic = "force-dynamic";

// GET /api/v1/admin/catalogue/:id/variants
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(
            `SELECT * FROM bazaar_product_variants WHERE product_id = $1 ORDER BY sort_order ASC`,
            [params.id]
        );
        return NextResponse.json(result.rows);

    } catch (error: any) {
        console.error("Admin Catalogue Variants GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST /api/v1/admin/catalogue/:id/variants
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { title, sku, price_override, weight_override, stock = 0, attributes = {}, is_default = false } = body;

        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

        if (is_default) {
            await db.query(`UPDATE bazaar_product_variants SET is_default = false WHERE product_id = $1`, [params.id]);
        }

        const result = await db.query(
            `INSERT INTO bazaar_product_variants (
                product_id, title, sku, price_override, weight_override, stock, attributes, is_default, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()) RETURNING *`,
            [params.id, title, sku, price_override, weight_override, stock, JSON.stringify(attributes), is_default]
        );

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error: any) {
        console.error("Admin Catalogue Variants POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
