import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '../../../db/index'; // Import your custom database client
import { NextRequest, NextResponse } from 'next/server';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});


export async function POST(request: NextRequest) {
  const client = createClient(); // Initialize your custom client (e.g., pg or ORM)

  try {
    const data = await request.formData();
    const files = data.getAll('files') as File[]; // Get all files from the request

    const uploadPromises = files.map(async (file) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { resource_type: 'image' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result!.secure_url); // Ensure `secure_url` exists
          }
        );
        upload.end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);

    // Assuming you have a pet_id to associate images with
    const pet_id = data.get('pet_id'); // Get pet_id from the request

    // Insert URLs into the database
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const order = i + 1; // Set the order of the images

      const query = `
        INSERT INTO pet_images (pet_id, image_url, created_at, order)
        VALUES ($1, $2, NOW(), $3)
      `;
      await client.query(query, [pet_id, url, order]);
    }

    return NextResponse.json({ urls }); // Return all uploaded image URLs
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  } finally {
    client.end(); // Close the database connection after the operation
  }
}