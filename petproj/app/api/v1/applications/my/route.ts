import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/applications/my:
 *   get:
 *     summary: Get current user's adoption and foster applications (V1 Hardened)
 *     tags: [v1 Applications]
 *   delete:
 *     summary: Delete an application (V1 Hardened)
 *     tags: [v1 Applications]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // 1. Fetch Adoptions
        const adoptionQuery = `
            SELECT
                'adoption' AS application_type,
                aa.adoption_id AS application_id,
                aa.pet_id,
                aa.status,
                aa.created_at,
                aa.adopter_name,
                aa.adopter_address,
                aa.contact_number,
                aa.age_of_youngest_child,
                aa.other_pets_details,
                aa.other_pets_neutered,
                aa.has_secure_outdoor_area,
                aa.pet_sleep_location,
                aa.pet_left_alone,
                aa.additional_details,
                p.pet_name,
                p.pet_breed AS breed,
                c.city_name,
                p.area,
                p.age_months,
                p.adoption_status,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
            FROM adoption_applications aa
            JOIN pets p ON aa.pet_id = p.pet_id
            JOIN cities c ON p.city_id = c.city_id
            WHERE aa.user_id = $1
            ORDER BY aa.created_at DESC;
        `;

        // 2. Fetch Fosters
        const fosterQuery = `
            SELECT
                'foster' AS application_type,
                fa.foster_id AS application_id,
                fa.pet_id,
                fa.status,
                fa.created_at,
                fa.fosterer_name,
                fa.fosterer_address,
                fa.foster_start_date,
                fa.foster_end_date,
                fa.fostering_experience,
                fa.age_of_youngest_child,
                fa.other_pets_details,
                fa.other_pets_neutered,
                fa.has_secure_outdoor_area,
                fa.pet_sleep_location,
                fa.pet_left_alone,
                fa.time_at_home,
                fa.reason_for_fostering,
                fa.additional_details,
                p.pet_name,
                p.pet_breed AS breed,
                c.city_name,
                p.area,
                p.age_months,
                p.adoption_status,
                (SELECT image_url FROM pet_images WHERE pet_id = p.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
            FROM foster_applications fa
            JOIN pets p ON fa.pet_id = p.pet_id
            JOIN cities c ON p.city_id = c.city_id
            WHERE fa.user_id = $1
            ORDER BY fa.created_at DESC;
        `;

        const [adoptions, fosters] = await Promise.all([
            db.query(adoptionQuery, [userId]),
            db.query(fosterQuery, [userId]).catch(() => ({ rows: [] }))
        ]);

        return NextResponse.json({
            applications: [...adoptions.rows, ...fosters.rows]
        });
    } catch (error) {
        console.error("V1 My Applications GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const application_id = searchParams.get('application_id');
        const type = searchParams.get('type'); // 'adoption' or 'foster'

        if (!application_id || !type) {
            return NextResponse.json({ error: "Missing application_id or type" }, { status: 400 });
        }

        const table = type === 'foster' ? 'foster_applications' : 'adoption_applications';
        const idCol = type === 'foster' ? 'foster_id' : 'adoption_id';

        // Ownership check
        const check = await db.query(`SELECT user_id FROM ${table} WHERE ${idCol} = $1`, [application_id]);
        if (check.rowCount === 0) return NextResponse.json({ error: "Application not found" }, { status: 404 });
        if (String(check.rows[0].user_id) !== String(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        await db.query(`DELETE FROM ${table} WHERE ${idCol} = $1`, [application_id]);

        return NextResponse.json({ success: true, message: "Application deleted" });
    } catch (error) {
        console.error("V1 My Applications DELETE Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
