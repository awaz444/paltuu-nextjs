import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/v1/applications/foster:
 *   post:
 *     summary: Submit a new foster application (V1 Hardened)
 *     tags: [v1 Applications]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('pet_id');

        if (!petId) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        // Verify Ownership
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [petId]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        
        if (petCheck.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden: You do not own this pet" }, { status: 403 });
        }

        const result = await db.query(`
            SELECT 
                f.*,
                p.pet_name,
                u.name as fosterer_name
            FROM foster_applications f
            JOIN pets p ON f.pet_id = p.pet_id
            JOIN users u ON f.user_id = u.user_id
            WHERE f.pet_id = $1
            ORDER BY f.created_at DESC
        `, [petId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Foster Applications GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const {
            pet_id,
            fosterer_name,
            fosterer_address,
            foster_start_date,
            foster_end_date,
            fostering_experience,
            age_of_youngest_child,
            other_pets_details,
            other_pets_neutered,
            has_secure_outdoor_area,
            pet_sleep_location,
            pet_left_alone,
            time_at_home,
            reason_for_fostering,
            additional_details,
            agree_to_terms,
        } = body;

        // Validation
        if (!pet_id || !agree_to_terms) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Check Pet Ownership
        const petRes = await db.query('SELECT owner_id, pet_name FROM pets WHERE pet_id = $1', [pet_id]);
        if (petRes.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        const { owner_id: ownerId, pet_name: petName } = petRes.rows[0];

        // 2. Insert Application
        const result = await db.query(`
            INSERT INTO foster_applications (
                user_id, pet_id, fosterer_name, fosterer_address, foster_start_date, 
                foster_end_date, status, fostering_experience, age_of_youngest_child, 
                other_pets_details, other_pets_neutered, has_secure_outdoor_area, 
                pet_sleep_location, pet_left_alone, time_at_home, reason_for_fostering, 
                additional_details, agree_to_terms, created_at
            ) VALUES (
                $1, $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW()
            ) RETURNING foster_id
        `, [
            userId, pet_id, fosterer_name, fosterer_address, foster_start_date,
            foster_end_date, fostering_experience, age_of_youngest_child, 
            other_pets_details, other_pets_neutered, has_secure_outdoor_area, 
            pet_sleep_location, pet_left_alone, time_at_home, reason_for_fostering, 
            additional_details, agree_to_terms
        ]);

        const fosterId = result.rows[0].foster_id;

        // 3. Create Notifications
        await db.query(`
            INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
            VALUES ($1, $2, $3, $4, false, NOW())
        `, [
            userId,
            'Application Submitted',
            `Your foster application for ${petName} has been submitted successfully!`,
            'foster_application_submission'
        ]);

        await db.query(`
            INSERT INTO notifications (user_id, title, body, type, is_read, created_at)
            VALUES ($1, $2, $3, $4, false, NOW())
        `, [
            ownerId,
            'New Application Received',
            `New foster application received for ${petName}!`,
            'new_foster_application'
        ]);

        return NextResponse.json({ success: true, fosterId });

    } catch (error) {
        console.error("V1 Foster Application Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
