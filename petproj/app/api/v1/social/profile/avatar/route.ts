import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getUserIdFromRequest } from "@/utils/authServer";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { db } from "@/db/index";

export const dynamic = "force-dynamic";

const ACCEPTED_TYPES = new Set([
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/heic", "image/heif", "image/avif",
]);

/**
 * POST /api/v1/social/profile/avatar
 * Accepts: JPEG, PNG, WebP, HEIC/HEIF (common on iPhone)
 * Outputs: 400×400 WebP stored in S3 paltuu-social/profile-pics/
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const mimeType = file.type.toLowerCase();
        if (!mimeType.startsWith("image/") || !ACCEPTED_TYPES.has(mimeType)) {
            return NextResponse.json(
                { error: `Unsupported format "${file.type}". Use JPEG, PNG, HEIC, or WebP.` },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // failOnError: false → tolerates minor HEIC/HEIF header quirks without crashing
        // .rotate()         → auto-corrects EXIF orientation (critical for iPhone photos)
        let optimized: Buffer;
        try {
            optimized = await sharp(buffer, { failOnError: false })
                .rotate()
                .resize(400, 400, { fit: "cover", position: "centre" })
                .webp({ quality: 90 })
                .toBuffer();
        } catch (sharpErr: any) {
            console.error("[avatar] sharp processing failed:", sharpErr?.message);
            return NextResponse.json(
                { error: "Could not process image. Try saving it as JPEG and re-uploading." },
                { status: 400 }
            );
        }

        const existing = await db.query(
            "SELECT profile_image_url FROM users WHERE user_id = $1",
            [userId]
        );
        const oldUrl: string | null = existing.rows[0]?.profile_image_url;

        let url: string;
        try {
            url = await uploadToS3(optimized, "profile-pics", "image/webp", "webp");
        } catch (s3Err: any) {
            const code = s3Err?.Code || s3Err?.name;
            const status = s3Err?.$metadata?.httpStatusCode;
            console.error(`[avatar] S3 PutObject failed [HTTP ${status} | Code: ${code}]:`, s3Err?.message);
            // HTTP 403 from S3 = IAM user missing s3:PutObject on this bucket/prefix
            return NextResponse.json({ error: "Storage upload failed. Please try again." }, { status: 500 });
        }

        await db.query(
            "UPDATE users SET profile_image_url = $1 WHERE user_id = $2",
            [url, userId]
        );

        if (oldUrl) {
            deleteFromS3(oldUrl).catch(() => {});
        }

        return NextResponse.json({ url });

    } catch (error) {
        console.error("[avatar] Unhandled error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
