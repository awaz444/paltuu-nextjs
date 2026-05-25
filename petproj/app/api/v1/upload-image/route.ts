import { NextRequest, NextResponse } from "next/server";
import { uploadToS3Main } from "@/lib/s3";

/**
 * @swagger
 * /api/upload-image:
 *   post:
 *     summary: Upload images to AWS S3 (paltuu-main/adoption)
 *     description: Upload multiple images and return their URLs
 *     tags: [Upload]
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        const urls: string[] = [];

        for (const file of files) {
            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = file.type.split("/")[1] || "jpg";
            const imageUrl = await uploadToS3Main(buffer, "adoption", file.type, ext);
            urls.push(imageUrl);
        }

        return NextResponse.json({ urls });
    } catch (error) {
        console.error("Upload Image Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
