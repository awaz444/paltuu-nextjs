/**
 * @swagger
 * /api/get-my-applications:
 *   get:
 *     summary: Auto-generated summary for /api/get-my-applications
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import { getUserIdFromRequest } from "@/utils/authServer";

export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();
    let userId: string | null = null;

    try {
        await client.connect();

        userId = await getUserIdFromRequest(req);

        if (!userId) {
            return NextResponse.json(
                { error: "Authentication required. Please login to view your applications." },
                { status: 401, headers: { "Content-Type": "application/json" } }
            );
        }

        // Query to get all adoption applications for the user
        const adoptionQuery = `
            SELECT 
                'adoption' AS application_type,
                aa.adoption_id AS application_id,
                aa.pet_id,
                aa.status,
                aa.created_at,
                p.pet_name,
                p.pet_breed AS breed,
                c.city_name,
                p.area,
                p.age_months,
                p.contact_number,
                p.adoption_status,
                pi.image_url
            FROM adoption_applications AS aa
            JOIN pets AS p ON aa.pet_id = p.pet_id
            JOIN cities AS c ON p.city_id = c.city_id
            LEFT JOIN pet_images AS pi ON p.pet_id = pi.pet_id AND pi.order = 1
            WHERE aa.user_id = $1
            ORDER BY aa.created_at DESC;
        `;

        // Query to get all foster applications for the user (if foster applications exist)
        const fosterQuery = `
            SELECT 
                'foster' AS application_type,
                fa.foster_id AS application_id,
                fa.pet_id,
                fa.status,
                fa.created_at,
                p.pet_name,
                p.pet_breed AS breed,
                c.city_name,
                p.area,
                p.age_months,
                p.contact_number,
                p.adoption_status,
                pi.image_url
            FROM foster_applications AS fa
            JOIN pets AS p ON fa.pet_id = p.pet_id
            JOIN cities AS c ON p.city_id = c.city_id
            LEFT JOIN pet_images AS pi ON p.pet_id = pi.pet_id AND pi.order = 1
            WHERE fa.user_id = $1
            ORDER BY fa.created_at DESC;
        `;

        const [adoptionApplications, fosterApplications] = await Promise.all([
            client.query(adoptionQuery, [userId]),
            client.query(fosterQuery, [userId]).catch(() => ({ rows: [] })) // Handle case where foster_applications table doesn't exist
        ]);

        // Combine both application results
        const combinedApplications = [
            ...adoptionApplications.rows,
            ...fosterApplications.rows,
        ];

        return NextResponse.json(
            { user_id: userId, applications: combinedApplications },
            { status: 200, headers: { "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("Database Error:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (error as Error).message,
            },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}