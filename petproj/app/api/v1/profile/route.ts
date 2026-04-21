import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { v2 as cloudinary } from "cloudinary";
import bcrypt from "bcryptjs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * @swagger
 * /api/v1/profile/listings:
 *   get:
 *     summary: Get authenticated user's pet listings (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
 *     summary: Update user profile avatar (V1 Hardened)
 *     tags: [v1 Profile]
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await req.formData();
        const file = data.get("file") as File;
        if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await new Promise<string>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { resource_type: "image", folder: "profile-images" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result!.secure_url);
                }
            );
            upload.end(buffer);
        });

        await db.query('UPDATE users SET profile_image_url = $1 WHERE user_id = $2', [imageUrl, userId]);
        return NextResponse.json({ success: true, url: imageUrl });
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
