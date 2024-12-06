import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../db/index"; // Import your custom database client
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const client = createClient(); // Initialize your custom database client (e.g., pg or ORM)

  try {
    const data = await request.formData();
    const files = data.getAll("files") as File[]; // Get all files from the request

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files were provided" },
        { status: 400 }
      );
    }

    const vet_id = data.get("vet_id"); // Vet ID for linking verification
    const qualification_id = data.get("qualification_id"); // Associated qualification ID

    if (!vet_id || !qualification_id) {
      return NextResponse.json(
        { error: "Vet ID or Qualification ID is missing from the request" },
        { status: 400 }
      );
    }

    console.log("Vet ID:", vet_id, "Qualification ID:", qualification_id);

    // Upload files to Cloudinary
    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) {
              console.error("Cloudinary upload error:", error);
              reject(error);
            } else {
              console.log("Uploaded URL:", result!.secure_url);
              resolve(result!.secure_url); // Ensure `secure_url` exists
            }
          }
        );
        upload.end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    console.log("Uploaded URLs:", urls);

    await client.connect();
    console.log("Database connected");

    // Insert image URLs into the vet-verification-application table
    for (let i = 0; i < urls.length; i++) {
      const image_url = urls[i];
      const image_id = uuidv4();

      console.log(`Inserting image ${i + 1} into the database`);
      try {
        const query = `
          INSERT INTO vet_verification_application (vet_id, qualification_id, image_url)
          VALUES ($1, $2, $3)
        `;
        const queryParams = [vet_id, qualification_id, image_url];

        console.log("Query Parameters:", queryParams);
        await client.query(query, queryParams);
        console.log(`Image ${i + 1} inserted successfully`);
      } catch (error) {
        console.error(`Error inserting image ${i + 1}:`, error);
        throw error; // Rethrow to break the process if needed
      }
    }

    return NextResponse.json(
      { message: "Images uploaded and stored successfully", urls },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to upload images", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    try {
      await client.end(); // Close the database connection after the operation
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}
