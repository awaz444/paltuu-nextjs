import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { AdoptionNotifications } from "@/lib/notifications";

/**
 * @swagger
 * /api/v1/applications/adoption:
 *   post:
 *     summary: Submit a new adoption application (V1 Hardened)
 *     tags: [v1 Applications]
 */

export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const petId = searchParams.get('pet_id');

        if (!petId) return NextResponse.json({ error: "Pet ID required" }, { status: 400 });

        // Verify Ownership: Only the pet owner can see applications
        const petCheck = await db.query('SELECT owner_id FROM pets WHERE pet_id = $1', [petId]);
        if (petCheck.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        
        // Allow the owner OR the applicant to see their own? No, the legacy page is for pet owners.
        if (petCheck.rows[0].owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden: You do not own this pet" }, { status: 403 });
        }

        const result = await db.query(`
            SELECT 
                a.*,
                p.pet_name,
                u.name as adopter_name
            FROM adoption_applications a
            JOIN pets p ON a.pet_id = p.pet_id
            JOIN users u ON a.user_id = u.user_id
            WHERE a.pet_id = $1
            ORDER BY a.created_at DESC
        `, [petId]);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Adoption Applications GET Error:", error);
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
            adopter_name,
            adopter_address,
            age_of_youngest_child,
            other_pets_details,
            other_pets_neutered,
            has_secure_outdoor_area,
            pet_sleep_location,
            pet_left_alone,
            additional_details,
            agree_to_terms,
            city_id,
            contact_number,
        } = body;

        // Sanitize integer inputs (convert empty strings to null)
        const sanitizedAgeOfYoungestChild = age_of_youngest_child === "" ? null : age_of_youngest_child;
        const sanitizedCityId = city_id === "" ? null : city_id;

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
            INSERT INTO adoption_applications (
                user_id, pet_id, adopter_name, adopter_address, status,
                age_of_youngest_child, other_pets_details, other_pets_neutered,
                has_secure_outdoor_area, pet_sleep_location, pet_left_alone,
                additional_details, agree_to_terms, city_id, contact_number, created_at
            ) VALUES (
                $1, $2, $3, $4, 'pending', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW()
            ) RETURNING adoption_id
        `, [
            userId, pet_id, adopter_name, adopter_address, 
            sanitizedAgeOfYoungestChild, other_pets_details, other_pets_neutered,
            has_secure_outdoor_area, pet_sleep_location, pet_left_alone,
            additional_details, agree_to_terms, sanitizedCityId, contact_number
        ]);

        const applicationId = result.rows[0].adoption_id;

        // 3. Create Notification
        AdoptionNotifications.onApplicationSubmitted(
            ownerId,
            userId,
            applicationId,
            petName,
            adopter_name || 'Someone'
        ).catch(console.error);

        return NextResponse.json({ success: true, applicationId });

    } catch (error) {
        console.error("V1 Adoption Application Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
