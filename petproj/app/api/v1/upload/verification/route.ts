import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

/**
 * @swagger
 * /api/v1/upload/verification:
 *   post:
 *     summary: Upload verification documents
 *     tags: [v1 Upload]
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

            const imageUrl = await new Promise<string>((resolve, reject) => {
                const upload = cloudinary.uploader.upload_stream(
                    {
                        resource_type: "auto",
                        folder: "verification-documents",
                        format: "webp"
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result!.secure_url);
                    }
                );
                upload.end(buffer);
            });

            urls.push(imageUrl);
        }

        return NextResponse.json({ urls });
    } catch (error) {
        console.error("Verification Upload Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
