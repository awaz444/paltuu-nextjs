import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/applications/foster:
 *   get:
 *     summary: Get foster applications (Role-based)
 *     tags: [v1 Applications]
 *   post:
 *     summary: Submit foster application
 *     tags: [v1 Applications]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const userId = user.user_id || user.id || user.sub;
        const isAdmin = user.role === 'admin';

        let query;
        let values = [];

        if (isAdmin) {
            query = `SELECT fa.*, p.pet_name FROM foster_applications fa JOIN pets p ON fa.pet_id = p.pet_id ORDER BY fa.created_at DESC`;
        } else {
            query = `
                SELECT fa.*, p.pet_name 
                FROM foster_applications fa 
                JOIN pets p ON fa.pet_id = p.pet_id 
                WHERE p.owner_id = $1
                ORDER BY fa.created_at DESC`;
            values = [userId];
        }

        const result = await db.query(query, values);
        return NextResponse.json(result.rows);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        
        // Validation
        const validation = validate(body, {
            pet_id: { required: true },
            fosterer_name: { required: true, min: 2 },
            fosterer_address: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        const {
            pet_id, fosterer_name, fosterer_address, foster_start_date, foster_end_date,
            fostering_experience, age_of_youngest_child, other_pets_details, 
            other_pets_neutered, has_secure_outdoor_area, pet_sleep_location, 
            pet_left_alone, additional_details
        } = body;

        await db.query('BEGIN');
        try {
            const appResult = await db.query(`
                INSERT INTO foster_applications (
                    user_id, pet_id, fosterer_name, fosterer_address, foster_start_date,
                    foster_end_date, status, fostering_experience, age_of_youngest_child,
                    other_pets_details, other_pets_neutered, has_secure_outdoor_area,
                    pet_sleep_location, pet_left_alone, additional_details, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, pet_id, fosterer_name, fosterer_address, foster_start_date, foster_end_date, fostering_experience, age_of_youngest_child, other_pets_details, other_pets_neutered, has_secure_outdoor_area, pet_sleep_location, pet_left_alone, additional_details]);

            const petResult = await db.query('SELECT owner_id, pet_name FROM pets WHERE pet_id = $1', [pet_id]);
            if (petResult.rowCount > 0) {
                const { owner_id, pet_name } = petResult.rows[0];
                await db.query(`
                    INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent, entity_type, entity_id)
                    VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, 'foster', $4)
                `, [owner_id, `New foster request for ${pet_name}`, 'new_foster_application', appResult.rows[0].foster_id]);
            }

            await db.query('COMMIT');
            return NextResponse.json(appResult.rows[0], { status: 201 });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Foster POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
