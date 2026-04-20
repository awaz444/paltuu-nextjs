import { v2 as cloudinary } from "cloudinary";
import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * @swagger
 * /api/v1/lost-and-found/images:
 *   post:
 *     summary: Upload image for a lost/found post with ownership check (V1 Hardened)
 *     tags: [v1 Community]
 */

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const data = await req.formData();
        const file = data.get("file") as File;
        const post_id = data.get("post_id");

        if (!file || !post_id) {
            return NextResponse.json({ error: "Missing file or post_id" }, { status: 400 });
        }

        // 1. Ownership Check
        const check = await db.query('SELECT user_id FROM lost_and_found_posts WHERE post_id = $1', [post_id]);
        if (check.rowCount === 0) return NextResponse.json({ error: "Post not found" }, { status: 404 });
        if (check.rows[0].user_id !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        // 2. Limit: One image per post
        const imgCheck = await db.query('SELECT image_id FROM lost_and_found_post_images WHERE post_id = $1', [post_id]);
        if (imgCheck.rowCount > 0) {
            return NextResponse.json({ error: "Post already has an image. Delete it first." }, { status: 400 });
        }

        // 3. Upload to Cloudinary
        const buffer = Buffer.from(await file.arrayBuffer());
        const imageUrl = await new Promise<string>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                { resource_type: "image", folder: "lost-and-found" },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result!.secure_url);
                }
            );
            upload.end(buffer);
        });

        // 4. Save to DB
        const result = await db.query(`
            INSERT INTO lost_and_found_post_images (post_id, image_url, created_at)
            VALUES ($1, $2, NOW())
            RETURNING *
        `, [post_id, imageUrl]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error("V1 Lost and Found Image Upload Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
