import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

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
