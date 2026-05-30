import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/pets/{id}:
 *   get:
 *     summary: Get single pet details
 *     tags: [v1 Pets]
 *   put:
 *     summary: Update pet listing
 *     tags: [v1 Pets]
 *   delete:
 *     summary: Delete pet listing
 *     tags: [v1 Pets]
 */

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const result = await db.query(`
            SELECT 
                pets.*,                      
                cities.city_name AS city,     
                users.name as owner_name,
                users.email as owner_email,
                users.phone_number as owner_phone,
                users.profile_image_url as owner_image
            FROM pets
            JOIN users ON pets.owner_id = users.user_id
            JOIN cities ON pets.city_id = cities.city_id
            WHERE pets.pet_id = $1
        `, [id]);

        if (result.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        const pet = result.rows[0];

        // Fetch images and tags
        const [images, tags] = await Promise.all([
            db.query('SELECT image_id, image_url, "order" FROM pet_images WHERE pet_id = $1 ORDER BY "order" ASC', [id]),
            db.query('SELECT t.tag_id, t.tag_name, t.tag_category FROM pet_tag_assignments pta JOIN pet_tags t ON pta.tag_id = t.tag_id WHERE pta.pet_id = $1', [id])
        ]);

        return NextResponse.json({
            ...pet,
            images: images.rows,
            tags: tags.rows
        });

    } catch (error) {
        console.error("V1 Pet Details error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.pathname.split("/").pop();
        const body = await req.json();

        // Ownership & Auth Check
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        const isOwner = String(petCheck.rows[0].owner_id) === String(user.user_id || user.id || user.sub);
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Update Logic
        const {
            pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
            description, sex, listing_type, vaccinated, neutered, price, rescue_story,
            energy_level, cuddliness_level, adoption_status, health_issues, min_age_of_children,
            can_live_with_dogs, can_live_with_cats, must_have_someone_home,
            images
        } = body;

        await db.query('BEGIN');
        try {
            const result = await db.query(
                `UPDATE pets SET 
                    pet_name = COALESCE($1, pet_name),
                    pet_type = COALESCE($2, pet_type),
                    pet_breed = COALESCE($3, pet_breed),
                    city_id = COALESCE($4, city_id),
                    area = COALESCE($5, area),
                    age_months = COALESCE($6, age_months),
                    contact_number = COALESCE($7, contact_number),
                    description = COALESCE($8, description),
                    sex = COALESCE($9, sex),
                    listing_type = COALESCE($10, listing_type),
                    vaccinated = COALESCE($11, vaccinated),
                    neutered = COALESCE($12, neutered),
                    price = $13,
                    rescue_story = COALESCE($14, rescue_story),
                    energy_level = COALESCE($15, energy_level),
                    cuddliness_level = COALESCE($16, cuddliness_level),
                    adoption_status = COALESCE($17, adoption_status),
                    health_issues = COALESCE($18, health_issues),
                    min_age_of_children = COALESCE($19, min_age_of_children),
                    can_live_with_dogs = COALESCE($20, can_live_with_dogs),
                    can_live_with_cats = COALESCE($21, can_live_with_cats),
                    must_have_someone_home = COALESCE($22, must_have_someone_home)
                WHERE pet_id = $23
                RETURNING *`,
                [
                    pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
                    description, sex, listing_type, vaccinated, neutered, price === "" ? null : price, rescue_story,
                    energy_level, cuddliness_level, adoption_status, health_issues, min_age_of_children,
                    can_live_with_dogs, can_live_with_cats, must_have_someone_home, id
                ].map(v => v === undefined ? null : v)
            );

            if (Array.isArray(images)) {
                const remainingImageIds = images.filter(img => img.image_id).map(img => img.image_id);
                if (remainingImageIds.length > 0) {
                    await db.query(
                        `DELETE FROM pet_images WHERE pet_id = $1 AND image_id NOT IN (${remainingImageIds.map((_, i) => `$${i + 2}`).join(', ')})`,
                        [id, ...remainingImageIds]
                    );
                } else {
                    await db.query(`DELETE FROM pet_images WHERE pet_id = $1`, [id]);
                }

                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    if (img.image_id) {
                        await db.query(
                            `UPDATE pet_images SET "order" = $1 WHERE image_id = $2 AND pet_id = $3`,
                            [i, img.image_id, id]
                        );
                    } else {
                        await db.query(
                            `INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)`,
                            [id, img.image_url, i]
                        );
                    }
                }
            }

            await db.query('COMMIT');
            return NextResponse.json(result.rows[0]);
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Pet Update error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const id = req.nextUrl.pathname.split("/").pop();

        // Ownership check
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        const isOwner = String(petCheck.rows[0].owner_id) === String(user.user_id || user.id || user.sub);
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Transactional Delete
        await db.query('BEGIN');
        try {
            await db.query('DELETE FROM pet_tag_assignments WHERE pet_id = $1', [id]);
            await db.query('DELETE FROM pet_images WHERE pet_id = $1', [id]);
            await db.query('DELETE FROM adoption_applications WHERE pet_id = $1', [id]);
            await db.query('DELETE FROM pets WHERE pet_id = $1', [id]);
            await db.query('COMMIT');
            return NextResponse.json({ message: "Pet deleted successfully" });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Pet Delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
