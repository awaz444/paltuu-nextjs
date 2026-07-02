import { NextRequest, NextResponse } from "next/server";
import { uploadToS3Main } from "@/lib/s3";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";

/**
 * @swagger
 * /api/upload-image:
 *   post:
 *     summary: Upload images to AWS S3 (paltuu-main/adoption) and save to pet_images
 *     description: Upload multiple images and return their URLs. If pet_id is provided, saves URLs to pet_images table.
 *     tags: [Upload]
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contentLength = Number(req.headers.get("content-length") || "0");
        if (contentLength > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const petId = formData.get("pet_id");

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        if (files.length > 10) {
            return NextResponse.json({ error: "Maximum 10 files per upload" }, { status: 400 });
        }

        const urls: string[] = [];

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "Each file must be 5 MB or smaller" }, { status: 413 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = file.type.split("/")[1] || "jpg";
            const imageUrl = await uploadToS3Main(buffer, "adoption", file.type, ext);
            urls.push(imageUrl);
        }

        // If pet_id was provided, persist URLs into pet_images table
        if (petId) {
            for (let i = 0; i < urls.length; i++) {
                await db.query(
                    `INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)`,
                    [petId, urls[i], i]
                );
            }
        }

        return NextResponse.json({ urls });
    } catch (error) {
        console.error("Upload Image Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
