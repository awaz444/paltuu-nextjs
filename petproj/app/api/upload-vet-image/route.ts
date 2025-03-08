import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const data = await request.formData();
        const file = data.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file was provided" },
                { status: 400 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const image_url = await new Promise<string>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "vet-profiles"
                },
                (error, result) => {
                    if (error) {
                        console.error("Cloudinary upload error:", error);
                        reject(error);
                    } else {
                        resolve(result!.secure_url);
                    }
                }
            );
            upload.end(buffer);
        });

        return NextResponse.json(
            { message: "Image uploaded successfully", image_url },
            { status: 201 }
        );
    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Failed to upload image", details: (error as Error).message },
            { status: 500 }
        );
    }
}