import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/profile/[id]/pets
 * Returns the list of pets owned by a specific user.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const userId = params.id;
        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const petsQuery = `
            SELECT 
                p.pet_id, p.pet_name, p.pet_breed, p.listing_type, p.adoption_status,
                p.age_months, p.sex, p.listing_type,
                (
                    SELECT i.image_url 
                    FROM pet_images i 
                    WHERE i.pet_id = p.pet_id 
                    ORDER BY i."order" ASC 
                    LIMIT 1
                ) as main_image
            FROM pets p
            WHERE p.owner_id = $1 AND p.approved = true
            ORDER BY p.created_at DESC
        `;
        const result = await db.query(petsQuery, [userId]);

        return NextResponse.json({
            pets: result.rows
        });

    } catch (error) {
        console.error("V1 Social Pets GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
