import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../../db/index";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
    const client = createClient();
    const user_id = request.nextUrl.pathname.split("/").pop();

    try {
        const data = await request.formData();
        const file = data.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file was provided" },
                { status: 400 }
            );
        }

        // Upload file to Cloudinary
        const buffer = Buffer.from(await file.arrayBuffer());
        const image_url = await new Promise<string>((resolve, reject) => {
            const upload = cloudinary.uploader.upload_stream(
                {
                    resource_type: "image",
                    folder: "profile-images"
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

        await client.connect();
        const updateQuery = `
            UPDATE users
            SET profile_image_url = $1
            WHERE user_id = $2
            RETURNING user_id, profile_image_url;
        `;
        const result = await client.query(updateQuery, [image_url, user_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: "Profile image updated successfully",
                url: image_url
            },
            { status: 200 }
        );

    } catch (error) {
        console.error("Error:", error);
        return NextResponse.json(
            { error: "Failed to upload image", details: (error as Error).message },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}