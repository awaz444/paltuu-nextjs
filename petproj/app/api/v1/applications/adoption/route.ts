import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/applications/adoption:
 *   get:
 *     summary: Get adoption applications (Role-based)
 *     tags: [v1 Applications]
 *   post:
 *     summary: Submit adoption application
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
            // Admins see all pending
            query = `SELECT aa.*, p.pet_name FROM adoption_applications aa JOIN pets p ON aa.pet_id = p.pet_id ORDER BY aa.created_at DESC`;
        } else {
            // Pet owners see apps for their pets
            query = `
                SELECT aa.*, p.pet_name 
                FROM adoption_applications aa 
                JOIN pets p ON aa.pet_id = p.pet_id 
                WHERE p.owner_id = $1
                ORDER BY aa.created_at DESC`;
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
            adopter_name: { required: true, min: 2 },
            adopter_address: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        const {
            pet_id, adopter_name, adopter_address, age_of_youngest_child, 
            other_pets_details, other_pets_neutered, has_secure_outdoor_area,
            pet_sleep_location, pet_left_alone, additional_details
        } = body;

        // Transaction for Notification & Application
        await db.query('BEGIN');
        try {
            const appResult = await db.query(`
                INSERT INTO adoption_applications (
                    user_id, pet_id, adopter_name, adopter_address, status,
                    age_of_youngest_child, other_pets_details, other_pets_neutered,
                    has_secure_outdoor_area, pet_sleep_location, pet_left_alone,
                    additional_details, created_at
                ) VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
                RETURNING *
            `, [userId, pet_id, adopter_name, adopter_address, age_of_youngest_child, other_pets_details, other_pets_neutered, has_secure_outdoor_area, pet_sleep_location, pet_left_alone, additional_details]);

            const petResult = await db.query('SELECT owner_id, pet_name FROM pets WHERE pet_id = $1', [pet_id]);
            if (petResult.rowCount > 0) {
                const { owner_id, pet_name } = petResult.rows[0];
                // Notify Owner
                await db.query(`
                    INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent, entity_type, entity_id)
                    VALUES ($1, $2, $3, false, CURRENT_TIMESTAMP, 'adoption', $4)
                `, [owner_id, `New adoption request for ${pet_name}`, 'new_application', appResult.rows[0].adoption_id]);
            }

            await db.query('COMMIT');
            return NextResponse.json(appResult.rows[0], { status: 201 });
        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Adoption POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
