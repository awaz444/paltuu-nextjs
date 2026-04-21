import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * @swagger
 * /api/v1/upload/shelter:
 *   post:
 *     summary: Upload shelter facility images
 *     tags: [v1 Upload]
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const imageUrl = await new Promise<string>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "shelter-images",
                    format: "webp"
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result!.secure_url);
                }
            );
            upload.end(buffer);
        });

        return NextResponse.json({ imageUrl });
    } catch (error) {
        console.error("Shelter Upload Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
