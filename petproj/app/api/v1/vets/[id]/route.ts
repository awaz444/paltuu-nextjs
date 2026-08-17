import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/vets/{id}:
 *   get:
 *     summary: Get a single vet's details, including reviews (V1)
 *     tags: [v1 Professional]
 */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const vetId = params.id;

        const vetResult = await db.query(
            `SELECT
                v.vet_id,
                v.user_id,
                cl.clinic_id,
                v.minimum_fee,
                v.contact_details,
                v.created_at,
                v.bio,
                v.schedule,
                v.qualifications,
                u.name         AS vet_name,
                u.dob,
                u.email,
                u.profile_image_url,
                cl.name        AS clinic_name,
                cl.address     AS location,
                cl.whatsapp_number AS clinic_whatsapp,
                cl.google_maps_link,
                cl.is_paltuu_partner,
                cl.is_verified,
                c.city_name    AS city
            FROM vets v
            JOIN users u  ON v.user_id   = u.user_id
            LEFT JOIN LATERAL (
                SELECT cv.clinic_id
                FROM clinic_vets cv
                WHERE cv.vet_id = v.vet_id
                ORDER BY cv.is_primary_location DESC NULLS LAST, cv.created_at ASC
                LIMIT 1
            ) primary_cv ON true
            LEFT JOIN clinics cl ON primary_cv.clinic_id = cl.clinic_id
            LEFT JOIN cities  c  ON u.city_id    = c.city_id
            WHERE v.vet_id = $1 AND v.is_active = true`,
            [vetId]
        );

        if (vetResult.rowCount === 0) {
            return NextResponse.json({ error: "Vet not found" }, { status: 404 });
        }
        const vet = vetResult.rows[0];

        const reviewsResult = await db.query(
            `SELECT
                vr.review_id,
                vr.rating,
                vr.review_content,
                vr.review_date,
                u.profile_image_url AS review_maker_profile_image_url,
                u.name              AS review_maker_name
            FROM vet_reviews vr
            JOIN users u ON vr.user_id = u.user_id
            WHERE vr.vet_id = $1
            ORDER BY vr.review_date DESC`,
            [vetId]
        );

        return NextResponse.json({ ...vet, reviews: reviewsResult.rows });

    } catch (error) {
        console.error("V1 Vet Detail GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
