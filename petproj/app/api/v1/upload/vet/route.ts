import { NextRequest, NextResponse } from "next/server";
import { uploadToS3Main } from "@/lib/s3";

/**
 * @swagger
 * /api/v1/upload/vet:
 *   post:
 *     summary: Upload vet profile images to AWS S3 (paltuu-main/vets)
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
        const ext = file.type.split("/")[1] || "jpg";
        const image_url = await uploadToS3Main(buffer, "vets", file.type, ext);

        return NextResponse.json({ image_url });
    } catch (error) {
        console.error("Vet Upload Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
