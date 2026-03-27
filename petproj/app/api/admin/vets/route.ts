import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        await client.connect();
        const query = `
            SELECT 
                v.vet_id, v.user_id, v.minimum_fee, v.contact_details, v.bio, 
                v.clinic_name, v.location, v.clinic_email, v.clinic_whatsapp,
                v.is_active, v.schedule, v.qualifications, v.license_number, v.specialization,
                u.name, u.email, u.profile_image_url
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            ORDER BY v.created_at DESC;
        `;
        const result = await client.query(query);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching vets:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const {
            name, email, profile_image_url, // User table fields
            clinic_name, location, minimum_fee, contact_details, 
            clinic_email, clinic_whatsapp, bio, license_number, specialization, qualifications
        } = body;

        if (!name || !email) {
            return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        }

        await client.connect();
        
        // Check if user exists
        let userResult = await client.query("SELECT user_id FROM users WHERE email = $1", [email]);
        let user_id;
        
        if (userResult.rows.length > 0) {
            user_id = userResult.rows[0].user_id;
            // Update user details
            await client.query(
                "UPDATE users SET name = $1, profile_image_url = $2, role = 'vet' WHERE user_id = $3",
                [name, profile_image_url, user_id]
            );
        } else {
            // Create user
            const defaultPassword = "NewVetPassword123"; // Adjust appropriately based on your auth logic
            userResult = await client.query(
                "INSERT INTO users (name, email, password, profile_image_url, role) VALUES ($1, $2, $3, $4, 'vet') RETURNING user_id",
                [name, email, defaultPassword, profile_image_url]
            );
            user_id = userResult.rows[0].user_id;
        }

        // Insert vet
        const vetQuery = `
            INSERT INTO vets (
                user_id, clinic_name, location, minimum_fee, contact_details,
                clinic_email, clinic_whatsapp, bio, license_number, specialization, qualifications
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *;
        `;
        const vetValues = [
            user_id, clinic_name, location, minimum_fee, contact_details,
            clinic_email, clinic_whatsapp, bio, license_number, specialization, qualifications
        ];
        
        const result = await client.query(vetQuery, vetValues);
        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Error creating vet:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const {
            vet_id, user_id, // Identifiers
            name, profile_image_url, // User table fields
            clinic_name, location, minimum_fee, contact_details,
            clinic_email, clinic_whatsapp, bio, is_active,
            license_number, specialization, qualifications
        } = body;

        if (!vet_id || !user_id) {
            return NextResponse.json({ error: "Vet ID and User ID are required" }, { status: 400 });
        }

        await client.connect();

        // 1. Update users table
        const userUpdateFields: string[] = [];
        const userValues: any[] = [];
        let uIndex = 1;

        if (name !== undefined) { userUpdateFields.push(`name = $${uIndex++}`); userValues.push(name); }
        if (profile_image_url !== undefined) { userUpdateFields.push(`profile_image_url = $${uIndex++}`); userValues.push(profile_image_url); }

        if (userUpdateFields.length > 0) {
            userValues.push(user_id);
            await client.query(`UPDATE users SET ${userUpdateFields.join(', ')} WHERE user_id = $${uIndex}`, userValues);
        }

        // 2. Update vets table
        const vetUpdateFields: string[] = [];
        const vetValues: any[] = [];
        let vIndex = 1;

        if (clinic_name !== undefined) { vetUpdateFields.push(`clinic_name = $${vIndex++}`); vetValues.push(clinic_name); }
        if (location !== undefined) { vetUpdateFields.push(`location = $${vIndex++}`); vetValues.push(location); }
        if (minimum_fee !== undefined) { vetUpdateFields.push(`minimum_fee = $${vIndex++}`); vetValues.push(minimum_fee); }
        if (contact_details !== undefined) { vetUpdateFields.push(`contact_details = $${vIndex++}`); vetValues.push(contact_details); }
        if (clinic_email !== undefined) { vetUpdateFields.push(`clinic_email = $${vIndex++}`); vetValues.push(clinic_email); }
        if (clinic_whatsapp !== undefined) { vetUpdateFields.push(`clinic_whatsapp = $${vIndex++}`); vetValues.push(clinic_whatsapp); }
        if (bio !== undefined) { vetUpdateFields.push(`bio = $${vIndex++}`); vetValues.push(bio); }
        if (is_active !== undefined) { vetUpdateFields.push(`is_active = $${vIndex++}`); vetValues.push(is_active); }
        if (license_number !== undefined) { vetUpdateFields.push(`license_number = $${vIndex++}`); vetValues.push(license_number); }
        if (specialization !== undefined) { vetUpdateFields.push(`specialization = $${vIndex++}`); vetValues.push(specialization); }
        if (qualifications !== undefined) { vetUpdateFields.push(`qualifications = $${vIndex++}`); vetValues.push(qualifications); }

        if (vetUpdateFields.length > 0) {
            vetValues.push(vet_id);
            await client.query(`UPDATE vets SET ${vetUpdateFields.join(', ')} WHERE vet_id = $${vIndex}`, vetValues);
        }

        return NextResponse.json({ message: "Vet updated successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error updating vet:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const body = await req.json();
        const { vet_id } = body;

        if (!vet_id) {
            return NextResponse.json({ error: "Vet ID is required" }, { status: 400 });
        }

        await client.connect();
        const query = `DELETE FROM vets WHERE vet_id = $1 RETURNING *;`;
        const result = await client.query(query, [vet_id]);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Vet not found" }, { status: 404 });
        }

        return NextResponse.json({ message: "Vet deleted successfully" }, { status: 200 });
    } catch (error) {
        console.error("Error deleting vet:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
