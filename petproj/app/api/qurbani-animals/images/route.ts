import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../../db/index"; // Import your custom database client
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface QurbaniAnimalPhoto {
  photo_id: string; // Changed to string for UUID
  animal_id: number;
  photo_url: string;
  order: number;
  created_at: string;
}

export async function POST(request: NextRequest) {
  const client = createClient();

  try {
    const data = await request.formData();
    const files = data.getAll("files") as File[];
    const animal_id = data.get("animal_id");

    // Validate input
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files were provided" },
        { status: 400 }
      );
    }

    if (!animal_id) {
      return NextResponse.json(
        { error: "Animal ID is missing from the request" },
        { status: 400 }
      );
    }

    console.log("Animal ID:", animal_id);

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
              resolve(result!.secure_url);
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

    // Insert URLs into the database
    for (let i = 0; i < urls.length; i++) {
      const photo_url = urls[i];
      const order = i + 1;
      const photo_id = uuidv4();

      console.log(`Inserting photo ${i + 1} into the database`);
      try {
        const query = `
          INSERT INTO qurbani_animals_photo (
            photo_id, animal_id, photo_url, "order", created_at
          )
          VALUES ($1, $2, $3, $4, NOW())
          RETURNING *;
        `;
        const queryParams = [photo_id, animal_id, photo_url, order];

        console.log("Query Parameters:", queryParams);
        const result = await client.query(query, queryParams);
        console.log(`Photo ${i + 1} inserted successfully`, result.rows[0]);
      } catch (error) {
        console.error(`Error inserting photo ${i + 1}:`, error);
        throw error;
      }
    }

    return NextResponse.json(
      { message: "Photos uploaded and stored successfully", urls },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Failed to upload photos", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}