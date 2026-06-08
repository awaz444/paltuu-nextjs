import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/admin/pets:
 *   get:
 *     summary: Admin view of all pet listings (V1 Hardened)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update any pet listing (Admin V1)
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete any pet listing (Admin V1)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const result = await db.query(`
            SELECT p.*, c.city_name as city,
                   COALESCE(
                       (SELECT json_agg(json_build_object('image_id', pi.image_id, 'image_url', pi.image_url, 'order', pi.order) ORDER BY pi.order)
                        FROM pet_images pi WHERE pi.pet_id = p.pet_id),
                       '[]'::json
                   ) as images
            FROM pets p
            LEFT JOIN cities c ON p.city_id = c.city_id
            ORDER BY p.created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const {
            pet_id, pet_name, pet_type, pet_breed, description, adoption_status,
            price, age_months, contact_number, listing_type, approved, images
        } = body;
        
        if (!pet_id) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        await db.query('BEGIN');
        try {
            const result = await db.query(`
                UPDATE pets SET 
                    pet_name = COALESCE($1, pet_name),
                    pet_type = COALESCE($2, pet_type),
                    pet_breed = COALESCE($3, pet_breed),
                    description = COALESCE($4, description),
                    adoption_status = COALESCE($5, adoption_status),
                    price = COALESCE($6, price),
                    age_months = COALESCE($7, age_months),
                    contact_number = COALESCE($8, contact_number),
                    listing_type = COALESCE($9, listing_type),
                    approved = COALESCE($10, approved)
                WHERE pet_id = $11
                RETURNING *
            `, [pet_name, pet_type, pet_breed, description, adoption_status, price, age_months, contact_number, listing_type, approved, pet_id]);

            if (result.rowCount === 0) {
                await db.query('ROLLBACK');
                return NextResponse.json({ error: "Pet not found" }, { status: 404 });
            }

            if (Array.isArray(images)) {
                const remainingImageIds = images.filter(img => img.image_id).map(img => img.image_id);
                if (remainingImageIds.length > 0) {
                    await db.query(
                        `DELETE FROM pet_images WHERE pet_id = $1 AND image_id NOT IN (${remainingImageIds.map((_, i) => `$${i + 2}`).join(', ')})`,
                        [pet_id, ...remainingImageIds]
                    );
                } else {
                    await db.query(`DELETE FROM pet_images WHERE pet_id = $1`, [pet_id]);
                }

                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    if (img.image_id) {
                        await db.query(
                            `UPDATE pet_images SET "order" = $1 WHERE image_id = $2 AND pet_id = $3`,
                            [i, img.image_id, pet_id]
                        );
                    } else {
                        await db.query(
                            `INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)`,
                            [pet_id, img.image_url, i]
                        );
                    }
                }
            }

            // Retrieve updated images list
            const updatedImages = await db.query(
                `SELECT image_id, image_url, "order" FROM pet_images WHERE pet_id = $1 ORDER BY "order" ASC`,
                [pet_id]
            );

            await db.query('COMMIT');
            return NextResponse.json({
                ...result.rows[0],
                images: updatedImages.rows
            });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }
    } catch (error) {
        console.error("Admin Pet Update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const pet_id = searchParams.get('pet_id');
        if (!pet_id) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        await db.query('DELETE FROM pets WHERE pet_id = $1', [pet_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
