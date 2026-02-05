import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export async function GET(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    const client = createClient();
    const clinicId = params.id;

    if (!clinicId) {
        return NextResponse.json({ error: "Clinic ID is required" }, { status: 400 });
    }

    try {
        await client.connect();

        // 1. Fetch Clinic Details
        const clinicQuery = `
            SELECT * FROM clinics WHERE clinic_id = $1;
        `;
        const clinicResult = await client.query(clinicQuery, [clinicId]);

        if (clinicResult.rows.length === 0) {
            return NextResponse.json({ error: "Clinic not found" }, { status: 404 });
        }

        const clinic = clinicResult.rows[0];

        // 2. Fetch Vets in this Clinic
        // We join with users to get the name and other user-related info
        const vetsQuery = `
            SELECT 
                v.vet_id,
                v.minimum_fee,
                v.bio,
                v.contact_details,
                u.name,
                u.email,
                u.profile_image_url
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            WHERE v.clinic_id = $1 AND v.is_active = true;
        `;
        const vetsResult = await client.query(vetsQuery, [clinicId]);

        const response = {
            ...clinic,
            vets: vetsResult.rows
        };

        return NextResponse.json(response, { status: 200 });

    } catch (error) {
        console.error("Error fetching clinic details:", error);
        return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
