import { v2 as cloudinary } from "cloudinary";
import { createClient } from "../../../db/index";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(request: NextRequest) {
  const client = createClient();

  console.log("[INFO] Incoming vet verification POST request");

  try {
    const data = await request.formData();
    console.log("[DEBUG] Form data received");

    const files = data.getAll("files") as File[];
    const vet_id = data.get("vet_id");
    const qualification_id = data.get("qualification_id");

    console.log("[DEBUG] Extracted fields:", {
      vet_id,
      qualification_id,
      numFiles: files?.length || 0,
    });

    if (!files || files.length === 0) {
      console.warn("[WARN] No files provided in request");
      return NextResponse.json({ error: "No files were provided" }, { status: 400 });
    }

    if (!vet_id || !qualification_id) {
      console.warn("[WARN] Missing vet_id or qualification_id");
      return NextResponse.json(
        { error: "Vet ID or Qualification ID is missing from the request" },
        { status: 400 }
      );
    }

    // Upload to Cloudinary
    console.log("[INFO] Starting Cloudinary uploads...");
    const uploadPromises = files.map(async (file, index) => {
      const buffer = Buffer.from(await file.arrayBuffer());
      return new Promise<string>((resolve, reject) => {
        const upload = cloudinary.uploader.upload_stream(
          { resource_type: "image" },
          (error, result) => {
            if (error) {
              console.error(`[ERROR] Cloudinary upload failed (file ${index + 1}):`, error);
              reject(error);
            } else {
              console.log(`[INFO] File ${index + 1} uploaded:`, result!.secure_url);
              resolve(result!.secure_url);
            }
          }
        );
        upload.end(buffer);
      });
    });

    const urls = await Promise.all(uploadPromises);
    console.log("[INFO] All files uploaded to Cloudinary:", urls);

    await client.connect();
    console.log("[INFO] Connected to database");

    // Insert uploaded image URLs
    for (let i = 0; i < urls.length; i++) {
      const image_url = urls[i];
      console.log(`[DEBUG] Inserting image ${i + 1} to DB`, { vet_id, qualification_id, image_url });

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

      try {
        await client.query(query, queryParams);
        console.log(`[INFO] Image ${i + 1} inserted into vet_verification_application`);
      } catch (queryErr) {
        console.error(`[ERROR] Failed to insert image ${i + 1}:`, queryErr);
      }
    }

    // Fetch vet user ID
    console.log("[INFO] Fetching vet user ID...");
    const vetUserResult = await client.query(`SELECT user_id FROM vets WHERE vet_id = $1`, [vet_id]);
    const vetUserId = vetUserResult.rows[0]?.user_id;

    if (!vetUserId) {
      console.error("[ERROR] Vet user ID not found for vet_id:", vet_id);
      return NextResponse.json({ error: "Vet user ID not found" }, { status: 400 });
    }
    console.log("[DEBUG] Vet user ID:", vetUserId);

    // Notify the vet
    const vetNotificationContent = `Your vet verification application has been submitted. It will be reviewed by an admin.`;
    await client.query(
      `INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
       VALUES ($1, $2, $3, $4, $5)`,
      [vetUserId, vetNotificationContent, "vet_application", false, new Date()]
    );
    console.log("[INFO] Notification sent to vet user");

    // Notify all admins
    console.log("[INFO] Fetching admin users...");
    const adminResult = await client.query(`SELECT user_id FROM users WHERE role = 'admin'`);
    const adminUserIds = adminResult.rows.map((row) => row.user_id);
    console.log("[DEBUG] Admin user IDs:", adminUserIds);

    if (adminUserIds.length > 0) {
      const adminNotificationContent = `A new vet verification application has been submitted. Please review it.`;
      const notificationQuery = `
        INSERT INTO notifications (user_id, notification_content, notification_type, is_read, date_sent)
        VALUES ${adminUserIds
          .map(
            (_, i) =>
              `($${i * 5 + 1}, $${i * 5 + 2}, $${i * 5 + 3}, $${i * 5 + 4}, $${i * 5 + 5})`
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
      console.log("[INFO] Notifications sent to all admin users");
    } else {
      console.warn("[WARN] No admin users found to notify");
    }

    return NextResponse.json(
      { message: "Vet verification application submitted successfully", urls },
      { status: 200 }
    );
  } catch (error) {
    console.error("[FATAL ERROR] Unexpected server error:", error);
    return NextResponse.json(
      { error: "Failed to upload images", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
      console.log("[INFO] Database connection closed");
    } catch (error) {
      console.error("[ERROR] Failed to close database connection:", error);
    }
  }
}
