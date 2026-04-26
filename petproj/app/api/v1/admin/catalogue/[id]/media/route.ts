import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../../../adminAuth";

export const dynamic = "force-dynamic";

// POST /api/v1/admin/catalogue/:id/media
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const { url, alt_text = "", ordering = 0, is_primary = false } = body;

        if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });

        if (is_primary) {
            await db.query(`UPDATE bazaar_product_media SET is_primary = false WHERE product_id = $1`, [params.id]);
        }

        const result = await db.query(
            `INSERT INTO bazaar_product_media (product_id, url, alt_text, ordering, is_primary, created_at)
             VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
            [params.id, url, alt_text, ordering, is_primary]
        );

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error: any) {
        console.error("Admin Catalogue Media POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
