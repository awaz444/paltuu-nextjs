/**
 * @swagger
 * /api/clinics:
 *   get:
 *     summary: Fetch all pet clinics
 *     tags: [Clinics]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    try {
        const query = `
            SELECT 
                clinic_id, 
                name, 
                address, 
                logo_url, 
                operating_hours, 
                contact_number, 
                whatsapp_number,
                is_paltuu_partner,
                google_maps_link,
                discount_details
            FROM clinics
            ORDER BY name ASC;
        `;
        const result = await client.query(query);
        return NextResponse.json(result.rows, { status: 200 });
    } catch (error) {
        console.error("Error fetching clinics:", error);
         return NextResponse.json(
            { error: "Internal Server Error", message: (error as Error).message },
            { status: 500 }
        );
    }
}
