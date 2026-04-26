import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getUserIdFromRequest } from "@/utils/authServer";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { db } from "@/db/index";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/profile/cover
 * Upload a cover photo → stored in S3 paltuu-social/covers/
 * Automatically updates the user's cover_photo_url in the DB.
 *
 * Request: multipart/form-data, field "file" (single image)
 * Response: { url: string }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
        if (!file.type.startsWith("image/")) return NextResponse.json({ error: "File must be an image" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());

        // Resize to standard cover dimensions: 1500x500px, convert to WebP
        const optimized = await sharp(buffer)
            .resize(1500, 500, { fit: "cover", position: "centre" })
            .webp({ quality: 88 })
            .toBuffer();

        // Fetch existing cover to delete from S3
        const existing = await db.query(
            "SELECT cover_photo_url FROM users WHERE user_id = $1",
            [userId]
        );
        const oldUrl: string | null = existing.rows[0]?.cover_photo_url;

        // Upload new cover
        const url = await uploadToS3(optimized, "covers", "image/webp", "webp");

        // Update DB
        await db.query(
            "UPDATE users SET cover_photo_url = $1 WHERE user_id = $2",
            [url, userId]
        );

        // Delete old S3 file
        if (oldUrl?.includes("paltuu-social.s3")) {
            deleteFromS3(oldUrl).catch(() => {});
        }

        return NextResponse.json({ url });

    } catch (error) {
        console.error("Cover Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
