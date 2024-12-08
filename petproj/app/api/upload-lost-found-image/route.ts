import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../db/index"; // Import your custom database client
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const client = createClient(); // Initialize your custom database client

  try {
    const data = await request.formData();
    const file = data.get("file") as File; // Get the single file from the request
    const post_id = data.get("post_id"); // Get the `post_id` from the request

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided" },
        { status: 400 }
      );
    }

    if (!post_id) {
      return NextResponse.json(
        { error: "Post ID is missing from the request" },
        { status: 400 }
      );
    }

    // Ensure only one image per post
    await client.connect();
    const existingImageQuery = `
      SELECT image_id FROM lost_and_found_post_images WHERE post_id = $1;
    `;
    const existingImageResult = await client.query(existingImageQuery, [post_id]);

    if (existingImageResult.rows.length > 0) {
      return NextResponse.json(
        { error: "A post can only have one image. Please delete the existing image first." },
        { status: 400 }
      );
    }

    // Upload file to Cloudinary
    const buffer = Buffer.from(await file.arrayBuffer());
    const image_url = await new Promise<string>((resolve, reject) => {
      const upload = cloudinary.uploader.upload_stream(
        { resource_type: "image" },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result!.secure_url); // Ensure `secure_url` exists
          }
        }
      );
      upload.end(buffer);
    });

    // Insert the image into the database (let the database handle image_id generation)
    const query = `
      INSERT INTO lost_and_found_post_images (post_id, image_url, created_at)
      VALUES ($1, $2, NOW())
      RETURNING *;
    `;
    const queryParams = [post_id, image_url];
    const result = await client.query(query, queryParams);

    return NextResponse.json(
      { message: "Image uploaded and stored successfully", image: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to upload image", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}
