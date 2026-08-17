import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { PetCareNotifications } from "@/lib/notifications";

/**
 * @swagger
 * /api/v1/reviews:
 *   get:
 *     summary: Get reviews for a target (Vet or Product)
 *     tags: [v1 Community]
 *   post:
 *     summary: Submit a review (V1)
 *     tags: [v1 Community]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const targetId = searchParams.get("target_id");
        const type = searchParams.get("type"); // 'vet', 'clinic' or 'product'

        if (!targetId || !type) return NextResponse.json({ error: "Missing target_id or type" }, { status: 400 });

        let query;
        if (type === 'vet') {
            query = `
                SELECT vr.*, u.name as reviewer_name, u.profile_image_url as reviewer_image
                FROM vet_reviews vr
                JOIN users u ON vr.user_id = u.user_id
                WHERE vr.vet_id = $1
                ORDER BY vr.review_date DESC
            `;
        } else if (type === 'clinic') {
            query = `
                SELECT vr.*, u.name as reviewer_name, u.profile_image_url as reviewer_image
                FROM vet_reviews vr
                JOIN users u ON vr.user_id = u.user_id
                WHERE vr.clinic_id = $1
                ORDER BY vr.review_date DESC
            `;
        } else {
            query = `
                SELECT pr.*, u.name as reviewer_name, u.profile_image_url as reviewer_image
                FROM bazaar_reviews pr
                JOIN users u ON pr.user_id = u.user_id
                WHERE pr.product_id = $1 AND pr.is_approved = true
                ORDER BY pr.created_at DESC
            `;
        }

        const result = await db.query(query, [targetId]);
        return NextResponse.json(result.rows);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { target_id, type, rating, comment } = body;

        const validation = validate({ target_id, type, rating }, {
            target_id: { required: true },
            type: { required: true },
            rating: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        let query;
        if (type === 'vet') {
            query = `INSERT INTO vet_reviews (vet_id, user_id, rating, review_content, review_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`;
        } else if (type === 'clinic') {
            query = `INSERT INTO vet_reviews (clinic_id, user_id, rating, review_content, review_date) VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP) RETURNING *`;
        } else {
            query = `INSERT INTO bazaar_reviews (product_id, user_id, rating, comment, is_approved, created_at) VALUES ($1, $2, $3, $4, false, CURRENT_TIMESTAMP) RETURNING *`;
        }

        const result = await db.query(query, [target_id, userId, rating, comment]);
        const review = result.rows[0];

        return NextResponse.json({ message: "Review submitted", review }, { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
