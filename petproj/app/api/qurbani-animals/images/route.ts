import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../../db/index"; // Import your custom database client
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4, validate as isUUID } from 'uuid';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export interface QurbaniAnimalPhoto {
  photo_id: string; // Changed to string for UUID
  animal_id: string;
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

    if (!animal_id || !isUUID(animal_id as string)) {
      return NextResponse.json(
        { error: "Valid animal ID is required" },
        { status: 400 }
      );
    }
    console.log("Received animal_id:", animal_id, "Type:", typeof animal_id);
    // Should log: "Received animal_id: fbca22bf-e65d-4057-9dff-921f3adb241d Type: string"

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

    // Start transaction for multiple inserts
    await client.query('BEGIN');

    try {
      // Insert URLs into the database
      for (let i = 0; i < urls.length; i++) {
        const photo_url = urls[i];
        const order = i + 1;

        console.log(`Inserting photo ${i + 1} into the database`);
        const query = `
          INSERT INTO qurbani_animals_photo (
            animal_id, photo_url, "order"
          )
          VALUES ($1, $2, $3)
          RETURNING photo_id; 
        `;
        const queryParams = [animal_id, photo_url, order];

        const result = await client.query(query, queryParams);
        console.log(`Photo inserted with ID:`, result.rows[0].photo_id);
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: "Photos uploaded and stored successfully",
        urls,
        count: urls.length
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload photos",
        details: (error as Error).message
      },
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