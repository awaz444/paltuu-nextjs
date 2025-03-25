import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const client = createClient();

  try {
    const data = await request.formData();
    const files = data.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "No files were provided" },
        { status: 400 }
      );
    }

    const vet_id = data.get("vet_id");
    const qualification_id = data.get("qualification_id");

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

    // Insert image URLs into vet_verification_application table
    for (let i = 0; i < urls.length; i++) {
      const image_url = urls[i];

      const query = `
        WITH vet_data AS (
          SELECT vet_id, user_id 
          FROM vets 
          WHERE user_id = $1
        )
        INSERT INTO vet_verification_application (vet_id, qualification_id, image_url)
        VALUES ((SELECT vet_id FROM vet_data), $2, $3);
      `;
      const queryParams = [vet_id, qualification_id, image_url];

      console.log("Query Parameters:", queryParams);
      await client.query(query, queryParams);
      console.log(`Image ${i + 1} inserted successfully`);
    }

    // **Fetch the vet's user ID**
    const vetUserResult = await client.query(
      `SELECT user_id FROM vets WHERE vet_id = $1`,
      [vet_id]
    );
    const vetUserId = vetUserResult.rows[0]?.user_id;

    if (!vetUserId) {
      console.error("Vet user ID not found.");
      return NextResponse.json({ error: "Vet user ID not found" }, { status: 400 });
    }

    // **Fetch all admin user IDs**
    const adminResult = await client.query(
      `SELECT user_id FROM users WHERE role = 'admin'`
    );
    const adminUserIds = adminResult.rows.map((row) => row.user_id);

    // **Insert notification for the vet**
    const vetNotificationContent = `Your vet verification application has been submitted. It will be reviewed by an admin.`;
    await client.query(
      `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        vetUserId,
        vetNotificationContent,
        "vet_application",
        false,
        new Date(),
      ]
    );

    // **Insert notifications for all admin users**
    if (adminUserIds.length > 0) {
      const adminNotificationContent = `A new vet verification application has been submitted. Please review it.`;
      const notificationQuery = `
        INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
        VALUES ${adminUserIds
          .map(
            (_, i) =>
              `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${
                i * 5 + 4
              }, $${i * 5 + 5})`
          )
          .join(", ")}
      `;

      const notificationValues = adminUserIds.flatMap((user_id) => [
        user_id,
        adminNotificationContent,
        "vet_application",
        false,
        new Date(),
      ]);

      await client.query(notificationQuery, notificationValues);
    }

    return NextResponse.json(
      { message: "Vet verification application submitted successfully", urls },
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
      await client.end();
      console.log("Database connection closed");
    } catch (error) {
      console.error("Error closing database connection:", error);
    }
  }
}
