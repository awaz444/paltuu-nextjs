import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/bazaar/products/{id}:
 *   put:
 *     summary: Update bazaar product (Admin only)
 *     tags: [v1 Bazaar]
 *   delete:
 *     summary: Delete bazaar product (Admin only)
 *     tags: [v1 Bazaar]
 */

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id;
        const body = await req.json();
        const { title, description, price, sku, status, category_id } = body;

        const allowedFields = ['title', 'description', 'price', 'sku', 'status'];
        const setClause: string[] = [];
        const values: any[] = [productId];

        Object.keys(body).forEach((key) => {
            if (allowedFields.includes(key)) {
                values.push(body[key]);
                setClause.push(`${key} = $${values.length}`);
            }
        });

        if (setClause.length === 0 && !category_id) {
            return NextResponse.json({ error: "No updates provided" }, { status: 400 });
        }

        if (setClause.length > 0) {
            const query = `
                UPDATE bazaar_products 
                SET ${setClause.join(', ')}, updated_at = NOW() 
                WHERE product_id = $1 
                RETURNING *
            `;
            await db.query(query, values);
        }

        if (category_id) {
            // Update category
            await db.query(`DELETE FROM bazaar_product_categories WHERE product_id = $1`, [productId]);
            await db.query(`INSERT INTO bazaar_product_categories (product_id, category_id) VALUES ($1, $2)`, [productId, category_id]);
        }

        const finalRes = await db.query(`SELECT * FROM bazaar_products WHERE product_id = $1`, [productId]);
        return NextResponse.json(finalRes.rows[0]);

    } catch (error) {
        console.error("V1 Products PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const productId = params.id;

        // Transactional delete
        await db.query('BEGIN');
        try {
            await db.query(`DELETE FROM bazaar_product_categories WHERE product_id = $1`, [productId]);
            await db.query(`DELETE FROM bazaar_product_media WHERE product_id = $1`, [productId]);
            await db.query(`DELETE FROM bazaar_product_variants WHERE product_id = $1`, [productId]);
            const result = await db.query(`DELETE FROM bazaar_products WHERE product_id = $1 RETURNING *`, [productId]);
            
            await db.query('COMMIT');

            if ((result.rowCount ?? 0) === 0) {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }

            return NextResponse.json({ success: true, message: "Product deleted" });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Products DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
