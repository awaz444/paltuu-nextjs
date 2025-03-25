import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        await client.connect();

        const query = `
            SELECT 
                vet_id, 
                user_id, 
                clinic_name, 
                location, 
                minimum_fee, 
                contact_details, 
                profile_verified, 
                created_at, 
                bio, 
                clinic_whatsapp, 
                clinic_email, 
                applied, 
                approved
            FROM vets
            WHERE vet_id = $1;
        `;

        const result = await client.query(query, [vet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return NextResponse.json(result.rows[0], {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}

export async function PUT(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    const vet_id = req.nextUrl.pathname.split("/").pop();

    if (!vet_id) {
        return NextResponse.json(
            { error: "Vet ID is required" },
            {
                status: 400,
                headers: { "Content-Type": "application/json" },
            }
        );
    }

    try {
        const body = await req.json();

        const {
            clinic_name,
            location,
            minimum_fee,
            contact_details,
            bio,
            clinic_whatsapp,
            clinic_email,
            applied,
            approved,
        } = body;

        await client.connect();

        const query = `
            UPDATE vets
            SET 
                clinic_name = COALESCE($1, clinic_name),
                location = COALESCE($2, location),
                minimum_fee = COALESCE($3, minimum_fee),
                contact_details = COALESCE($4, contact_details),
                bio = COALESCE($5, bio),
                clinic_whatsapp = COALESCE($6, clinic_whatsapp),
                clinic_email = COALESCE($7, clinic_email),
                applied = COALESCE($8, applied),
                approved = COALESCE($9, approved)
            WHERE vet_id = $10
            RETURNING *;
        `;

        const values = [
            clinic_name,
            location,
            minimum_fee,
            contact_details,
            bio,
            clinic_whatsapp,
            clinic_email,
            applied,
            approved,
            vet_id,
        ];

        const result = await client.query(query, values);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Vet not found" },
                {
                    status: 404,
                    headers: { "Content-Type": "application/json" },
                }
            );
        }

        return NextResponse.json(result.rows[0], {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}