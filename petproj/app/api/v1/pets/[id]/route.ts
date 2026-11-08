import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import { hasSevereIdentityMatch } from "@/lib/moderation/badWords";
import { validate } from "@/utils/validation";
import { normalizePhone, isValidPhone } from "@/utils/phone";
import { notifyTeam, userName } from "@/lib/whatsappNotify";
import { getPetDetails } from "@/lib/petDetails";
import { db as contactDb } from "@/db/index";

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
        const rawId = req.nextUrl.pathname.replace(/\/+$/, '').split("/").pop();
        if (!rawId || isNaN(parseInt(rawId, 10))) return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
        const id = parseInt(rawId, 10);

        const pet = await getPetDetails(id);
        if (!pet) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        // Contact details are for signed-in users only (lib/contacts.ts). The
        // listing's own number goes to anyone signed in; the owner's account
        // email and phone only to admins and the owner (admin-pet-approval).
        const viewer = await getUserFromRequest(req);
        if (!viewer) return NextResponse.json(pet);
        const viewerId = Number((viewer as any).id ?? (viewer as any).user_id ?? (viewer as any).sub);
        const { rows } = await contactDb.query(
            `SELECT pets.contact_number, users.email AS owner_email, users.phone_number AS owner_phone
               FROM pets JOIN users ON users.user_id = pets.owner_id WHERE pets.pet_id = $1`,
            [id]
        );
        const isAdminOrOwner = (viewer as any).role === "admin" || viewerId === Number(pet.owner_id);
        return NextResponse.json({
            ...pet,
            contact_number: rows[0]?.contact_number ?? null,
            ...(isAdminOrOwner ? { owner_email: rows[0]?.owner_email ?? null, owner_phone: rows[0]?.owner_phone ?? null } : {}),
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

        const rawId = req.nextUrl.pathname.replace(/\/+$/, '').split("/").pop();
        if (!rawId || isNaN(parseInt(rawId, 10))) return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
        const id = parseInt(rawId, 10);
        const body = await req.json();

        // Ownership & Auth Check
        const petCheck = await db.query('SELECT owner_id, adoption_status FROM pets WHERE pet_id = $1', [id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        const currentUserId = String(user.user_id || user.id || user.sub);
        const isOwner = String(petCheck.rows[0].owner_id) === currentUserId;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Update Logic
        const {
            pet_name, pet_type, city_id, area, age_months, contact_number,
            description, sex, listing_type, vaccinated, neutered, price, rescue_story,
            energy_level, cuddliness_level, adoption_status, health_issues, min_age_of_children,
            can_live_with_dogs, can_live_with_cats, must_have_someone_home,
            images, tags, breed_id
        } = body;
        let { pet_breed } = body;

        // If breed_id is supplied, validate it belongs to the species and sync pet_breed
        let breedIdToStore: number | null | undefined = undefined;
        if (breed_id !== undefined) {
            if (breed_id === null || breed_id === "") {
                breedIdToStore = null;
            } else {
                const targetSpecies = pet_type !== undefined ? Number(pet_type) : null;
                const breedQuery = targetSpecies
                    ? await db.query(
                        `SELECT breed_id, name FROM breeds WHERE breed_id = $1 AND category_id = $2 AND is_active = true`,
                        [Number(breed_id), targetSpecies]
                    )
                    : await db.query(
                        `SELECT b.breed_id, b.name FROM breeds b JOIN pets p ON p.pet_type = b.category_id WHERE b.breed_id = $1 AND p.pet_id = $2 AND b.is_active = true`,
                        [Number(breed_id), id]
                    );
                if (!breedQuery.rows.length) {
                    return NextResponse.json({ errors: ["Pick a breed from the list for this pet type"] }, { status: 400 });
                }
                breedIdToStore = breedQuery.rows[0].breed_id;
                pet_breed = breedQuery.rows[0].name;
            }
        }

        if ((pet_name && hasSevereIdentityMatch(pet_name)) || (description && hasSevereIdentityMatch(description))) {
            return NextResponse.json({ error: "Listing contains language that isn't allowed" }, { status: 400 });
        }

        // Guard field lengths against the underlying column widths so an
        // oversized value returns a 400 rather than a Postgres 22001 ("value
        // too long for type character varying") surfacing as a 500.
        const validation = validate(body, {
            pet_name: { max: 255 },
            pet_breed: { max: 255 },
            area: { max: 255 },
            sex: { max: 255 },
            listing_type: { max: 255 },
            contact_number: { max: 255 },
            health_issues: { max: 255 },
            adoption_status: { max: 255 },
            description: { max: 2500 }
        });
        if (!validation.success) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        // Canonicalise to E.164 when a number is provided; leave undefined
        // alone so the COALESCE keeps the existing value. Rejects invalid numbers.
        let contactNumberToStore: string | null | undefined = undefined;
        if (contact_number !== undefined) {
            if (contact_number === null || String(contact_number).trim() === "") {
                contactNumberToStore = null;
            } else {
                const normalized = normalizePhone(contact_number);
                if (!normalized || !isValidPhone(normalized)) {
                    return NextResponse.json(
                        { errors: ["Invalid contact number. Pakistani mobile numbers must be 11 digits starting with 03 (e.g. 0300 1234567) or +92 3XX XXXXXXX."] },
                        { status: 400 }
                    );
                }
                contactNumberToStore = normalized;
            }
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const result = await client.query(
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
                    must_have_someone_home = COALESCE($22, must_have_someone_home),
                    breed_id = COALESCE($23, breed_id),
                    -- Relisting (e.g. a paused listing toggled back to available) counts as a renewal.
                    bumped_at = CASE WHEN $17::varchar = 'available' AND adoption_status IS DISTINCT FROM 'available'
                                     THEN now() ELSE bumped_at END,
                    -- Any explicit status change answers a pending "still available?" check.
                    availability_check_sent_at = CASE WHEN $17::varchar IS NOT NULL AND $17::varchar IS DISTINCT FROM adoption_status
                                     THEN NULL ELSE availability_check_sent_at END
                WHERE pet_id = $24
                RETURNING *`,
                [
                    pet_name, pet_type, pet_breed, city_id, area, age_months, contactNumberToStore,
                    description, sex, listing_type, vaccinated, neutered, price === "" ? null : price, rescue_story,
                    energy_level, cuddliness_level, adoption_status, health_issues, min_age_of_children,
                    can_live_with_dogs, can_live_with_cats, must_have_someone_home, breedIdToStore, id
                ].map(v => v === undefined ? null : v)
            );

            if (Array.isArray(images)) {
                const remainingImageIds = images.filter(img => img.image_id).map(img => img.image_id);
                if (remainingImageIds.length > 0) {
                    await client.query(
                        `DELETE FROM pet_images WHERE pet_id = $1 AND image_id NOT IN (${remainingImageIds.map((_, i) => `$${i + 2}`).join(', ')})`,
                        [id, ...remainingImageIds]
                    );
                } else {
                    await client.query(`DELETE FROM pet_images WHERE pet_id = $1`, [id]);
                }

                for (let i = 0; i < images.length; i++) {
                    const img = images[i];
                    if (img.image_id) {
                        await client.query(
                            `UPDATE pet_images SET "order" = $1 WHERE image_id = $2 AND pet_id = $3`,
                            [i, img.image_id, id]
                        );
                    } else {
                        await client.query(
                            `INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)`,
                            [id, img.image_url, i]
                        );
                    }
                }
            }

            if (Array.isArray(tags)) {
                await client.query('DELETE FROM pet_tag_assignments WHERE pet_id = $1', [id]);
                if (tags.length > 0) {
                    const values = tags.map((_, i) => `($1, $${i + 2})`).join(', ');
                    await client.query(
                        `INSERT INTO pet_tag_assignments (pet_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
                        [id, ...tags]
                    );
                }
            }

            await client.query('COMMIT');

            const updated = result.rows[0];
            const before = petCheck.rows[0].adoption_status;
            if (updated && updated.adoption_status !== before && (updated.adoption_status === 'adopted' || updated.adoption_status === 'unavailable')) {
                await notifyTeam(
                    "team_listing_closed",
                    {
                        pet_id: id,
                        pet_name: updated.pet_name,
                        reason: updated.adoption_status,
                        by: user.name || (await userName(currentUserId)),
                    },
                    `listing:${id}:${updated.adoption_status}:${Date.now()}`,
                );
            }

            return NextResponse.json(updated);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
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

        const rawId = req.nextUrl.pathname.replace(/\/+$/, '').split("/").pop();
        if (!rawId || isNaN(parseInt(rawId, 10))) return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });
        const id = parseInt(rawId, 10);

        // Ownership check
        const petCheck = await db.query('SELECT owner_id, pet_name FROM pets WHERE pet_id = $1', [id]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });

        const currentUserId = String(user.user_id || user.id || user.sub);
        const isOwner = String(petCheck.rows[0].owner_id) === currentUserId;
        const isAdmin = user.role === 'admin';

        if (!isOwner && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // Transactional Delete
        const client = await db.connect();
        try {
            await client.query('BEGIN');
            // Clean up dependent tables without ON DELETE CASCADE
            await client.query('DELETE FROM rescue_images WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM rescue_medical_conditions WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM rescue_special_needs WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM pet_tag_assignments WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM pet_images WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM adoption_applications WHERE pet_id = $1', [id]);
            await client.query('UPDATE pet_profiles SET adoption_listing_id = NULL WHERE adoption_listing_id = $1', [id]);
            await client.query('UPDATE social_posts SET pet_id = NULL WHERE pet_id = $1', [id]);
            await client.query('DELETE FROM pets WHERE pet_id = $1', [id]);
            await client.query('COMMIT');

            await notifyTeam(
                "team_listing_closed",
                {
                    pet_id: id,
                    pet_name: petCheck.rows[0].pet_name,
                    reason: "deleted",
                    by: user.name || (await userName(currentUserId)),
                },
                `listing:${id}:deleted`,
            );

            return NextResponse.json({ message: "Pet deleted successfully" });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("V1 Pet Delete error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
