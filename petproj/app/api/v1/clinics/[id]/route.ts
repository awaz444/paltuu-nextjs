import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    context: any // Use any temporarily to avoid type issues with params in some Next.js versions
) {
    try {
        const params = context.params;
        const id = params?.id;
        
        console.log(`[Detailed API] id: ${id}, params: ${JSON.stringify(params)}`);

        if (!id) {
            return NextResponse.json({ error: "No ID provided" }, { status: 400 });
        }

        // Fetch clinic details - force cast ID to string for pg
        const clinicResult = await db.query(
            "SELECT * FROM clinics WHERE CAST(clinic_id AS TEXT) = $1",
            [String(id)]
        );

        if (!clinicResult || clinicResult.rowCount === 0) {
            console.log(`[API] Clinic ${id} not found in database`);
            return NextResponse.json({ error: "Clinic not found in DB" }, { status: 404 });
        }

        const clinic = clinicResult.rows[0];

        // Fetch veterinarians for this clinic via the clinic_vets join table
        const vetsResult = await db.query(`
            SELECT 
                v.*, 
                u.name, 
                u.profile_image_url,
                u.email,
                cv.consultation_fee,
                cv.schedule_notes
            FROM vets v
            JOIN clinic_vets cv ON v.vet_id = cv.vet_id
            LEFT JOIN users u ON v.user_id = u.user_id
            WHERE cv.clinic_id = $1 AND v.is_active = true
        `, [id]);

        console.log(`[API] Found clinic ${id} and ${vetsResult.rowCount} vets via clinic_vets`);

        return NextResponse.json({
            ...clinic,
            vets: vetsResult.rows || [],
            reviews: []
        });

    } catch (error) {
        console.error("Error fetching clinic detail:", error);
        return NextResponse.json({ 
            error: "Internal Server Error",
            message: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
