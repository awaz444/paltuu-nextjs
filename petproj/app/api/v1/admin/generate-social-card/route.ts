import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import { generateSocialCard } from "@/lib/social-card";
import { uploadSocialCardToS3 } from "@/lib/s3";

export async function POST(req: NextRequest) {
    const user = await getUserFromRequest(req);
    if (!user || user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const { pet_id } = await req.json();
        if (!pet_id || typeof pet_id !== "number") {
            return NextResponse.json({ error: "pet_id is required and must be a number" }, { status: 400 });
        }

        const result = await db.query(
            `SELECT p.listing_type, p.health_issues,
                c.city_name,
                (SELECT image_url FROM pet_images
                 WHERE pet_id = p.pet_id
                 ORDER BY "order" ASC LIMIT 1) AS first_image
             FROM pets p
             LEFT JOIN cities c ON p.city_id = c.city_id
             WHERE p.pet_id = $1`,
            [pet_id]
        );

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        }

        const { listing_type, health_issues, city_name, first_image } = result.rows[0];

        if (!first_image) {
            return NextResponse.json({ error: "Pet has no images" }, { status: 422 });
        }

        if (!city_name) {
            return NextResponse.json({ error: "Pet has no city" }, { status: 422 });
        }

        const cardBuffer = await generateSocialCard({
            imageUrl: first_image,
            city: city_name,
            listing_type: listing_type ?? "adoption",
            healthIssue: health_issues ?? null,
        });

        const social_card_url = await uploadSocialCardToS3(cardBuffer, pet_id);

        await db.query(
            `UPDATE pets SET social_card_url = $1 WHERE pet_id = $2`,
            [social_card_url, pet_id]
        );

        return NextResponse.json({ social_card_url });
    } catch (error) {
        console.error("generate-social-card error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
