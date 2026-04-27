import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import sharp from "sharp";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";

const ACCEPTED_TYPES = new Set([
    "image/jpeg", "image/jpg", "image/png", "image/webp",
    "image/heic", "image/heif", "image/avif",
]);

/**
 * @swagger
 * /api/v1/profile/listings:
 *   get:
 *     summary: Get authenticated user's pet listings (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const result = await db.query(`
            SELECT user_id, name, email, profile_image_url, role, created_at, phone_number, dob, city_id
            FROM users
            WHERE user_id = $1
        `, [userId]);

        if ((result.rowCount ?? 0) === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("V1 Profile GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/v1/profile/avatar:
 *   post:
 *     summary: Update user profile avatar via AWS S3 (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function POST(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const userId = parseInt(String(userIdRaw), 10);

        const data = await req.formData();
        const file = data.get("file") as File;
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const mimeType = file.type.toLowerCase();
        if (!mimeType.startsWith("image/") || !ACCEPTED_TYPES.has(mimeType)) {
            return NextResponse.json(
                { error: `Unsupported format "${file.type}". Use JPEG, PNG, HEIC, or WebP.` },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());

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
            console.error("[avatar] S3 PutObject failed:", s3Err?.message);
            return NextResponse.json({ error: "Storage upload failed. Please try again." }, { status: 500 });
        }

        await db.query('UPDATE users SET profile_image_url = $1 WHERE user_id = $2', [url, userId]);

        if (oldUrl) {
            deleteFromS3(oldUrl).catch(() => {});
        }

        return NextResponse.json({ success: true, url });
    } catch (error) {
        console.error("V1 Profile Avatar Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * @swagger
 * /api/v1/profile:
 *   patch:
 *     summary: Update user profile (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function PATCH(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { name, phone_number, dob, city_id } = body;

        const result = await db.query(`
            UPDATE users SET 
                name = COALESCE($1, name),
                phone_number = COALESCE($2, phone_number),
                dob = COALESCE($3, dob),
                city_id = COALESCE($4, city_id)
            WHERE user_id = $5
            RETURNING user_id, name, email, profile_image_url, role, created_at, phone_number, dob, city_id
        `, [name, phone_number, dob, city_id, userId]);

        if (result.rowCount === 0) return NextResponse.json({ error: "User not found" }, { status: 404 });
        return NextResponse.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error("V1 Profile PATCH Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
