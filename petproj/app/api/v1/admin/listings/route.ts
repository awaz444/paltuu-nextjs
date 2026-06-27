import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import { NotificationService } from "@/lib/notifications/NotificationService";
import { NotificationType, EntityType } from "@/lib/notifications/notificationTypes";
import { generateSocialCard } from "@/lib/social-card";
import { uploadSocialCardToS3 } from "@/lib/s3";

/**
 * @swagger
 * /api/v1/admin/listings:
 *   get:
 *     summary: Fetch all unapproved pet listings (Admin V1)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Approve or Reject a listing (Admin V1)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const result = await db.query(`
            SELECT p.*, c.city_name as city
            FROM pets p
            LEFT JOIN cities c ON p.city_id = c.city_id
            WHERE p.approved = false
            ORDER BY p.created_at DESC
        `);
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error("V1 Admin Listings GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const { pet_id, approved } = await req.json();
        if (!pet_id || typeof approved !== 'boolean') {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const result = await db.query(`
            UPDATE pets SET approved = $1, created_at = NOW()
            WHERE pet_id = $2
            RETURNING *
        `, [approved, pet_id]);

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        const pet = result.rows[0];

        if (approved) {
            await NotificationService.createAndSend({
                userId: pet.owner_id,
                senderId: null, // System/admin notification, prevents self-notification skip during tests
                type: NotificationType.ADOPTION_LISTING_APPROVED,
                entityType: EntityType.ADOPTION_PET,
                entityId: pet.pet_id,
                customData: {
                    pet_name: pet.pet_name
                }
            });

            // Fire social card generation — failure does not block approval
            (async () => {
                try {
                    const cardData = await db.query(
                        `SELECT c.city_name, p.health_issues,
                            (SELECT image_url FROM pet_images
                             WHERE pet_id = $1
                             ORDER BY "order" ASC LIMIT 1) AS first_image
                         FROM cities c, pets p WHERE c.city_id = $2 AND p.pet_id = $1`,
                        [pet_id, pet.city_id]
                    );
                    const { city_name, health_issues, first_image } = cardData.rows[0] ?? {};
                    if (first_image && city_name) {
                        const buffer = await generateSocialCard({
                            imageUrl: first_image,
                            city: city_name,
                            listing_type: pet.listing_type ?? "adoption",
                            healthIssue: health_issues ?? null,
                        });
                        const social_card_url = await uploadSocialCardToS3(buffer, pet_id);
                        await db.query(
                            `UPDATE pets SET social_card_url = $1 WHERE pet_id = $2`,
                            [social_card_url, pet_id]
                        );
                    }
                } catch (cardErr) {
                    console.error("Social card auto-generation failed (non-blocking):", cardErr);
                }
            })();
        }

        return NextResponse.json({ success: true, pet });
    } catch (error) {
        console.error("V1 Admin Listings PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// For backward compatibility during migration
export async function POST(req: NextRequest) {
    return PATCH(req);
}
