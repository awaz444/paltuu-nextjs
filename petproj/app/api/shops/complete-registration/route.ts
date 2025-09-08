import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("Starting shop complete registration process...");
  const client = createClient();

  try {
    console.log("Parsing form data...");
    const formData = await req.formData();

    // Get the JSON data
    const dataJson = formData.get("data") as string;
    if (!dataJson) {
      throw new Error("No data field found in form data");
    }

    const data = JSON.parse(dataJson);
    console.log("Extracted data:", {
      email: data.email,
      name: data.name,
      shopName: data.shopName,
    });

    // Extract all data fields
    const {
      email,
      password,
      name,
      phone_number,
      city_id,
      role,
      shopName,
      address,
      accountTitle,
      iban,
      bankName,
      socials,
    } = data;

    console.log("Connecting to database...");
    await client.connect();
    console.log("Starting database transaction...");
    await client.query("BEGIN");

    // Check if email already exists
    console.log("Checking if email already exists:", email);
    const emailCheck = await client.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      console.log("Email already exists, rolling back transaction");
      await client.query("ROLLBACK");
      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          message: "This email is already registered",
        },
        { status: 400 }
      );
    }

    // Create user
    console.log("Creating user...");
    const userResult = await client.query(
      `INSERT INTO users (
        username, name, email, password, phone_number, city_id, role, profile_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
      [
        email,
        name,
        email,
        password,
        phone_number,
        city_id,
        role || "shop admin",
        "/default-avatar.png",
      ]
    );

    const userId = userResult.rows[0].user_id;
    console.log("User created with ID:", userId);

    // Handle file uploads to Cloudinary
    const logoFile = formData.get("logo") as File | null;

    // Upload files to Cloudinary
    const uploadFileToCloudinary = async (file: File | null): Promise<string | null> => {
      if (!file || file.size === 0) return null;
      
      try {
        console.log("Uploading file to Cloudinary:", file.name);
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
      } catch (error) {
        console.error("Error uploading file to Cloudinary:", error);
        return null;
      }
    };

    // Upload logo
    const logoUrl = await uploadFileToCloudinary(logoFile);

    // Create shop
    console.log("Creating shop...");
    const shopResult = await client.query(
      `INSERT INTO shops (
        user_id, shop_name, address, logo_url
      ) VALUES ($1, $2, $3, $4) RETURNING shop_id`,
      [
        userId,
        shopName,
        address,
        logoUrl,
      ]
    );

    const shopId = shopResult.rows[0].shop_id;
    console.log("Shop created with ID:", shopId);

    // Save bank info
    console.log("Saving bank info...");
    await client.query(
      `INSERT INTO shop_bank_info (
        shop_id, account_title, iban, bank_name
      ) VALUES ($1, $2, $3, $4)`,
      [shopId, accountTitle, iban, bankName]
    );

    // Save socials
    console.log("Saving socials...");
    await Promise.all(
      ["instagram", "facebook", "website"]
        .filter((platform) => socials[platform])
        .map((platform) =>
          client.query(
            "INSERT INTO shop_socials (shop_id, platform, url) VALUES ($1, $2, $3)",
            [shopId, platform, socials[platform]]
          )
        )
    );

    console.log("Committing transaction...");
    await client.query("COMMIT");

    console.log("Registration completed successfully!");
    return NextResponse.json(
      { success: true, userId, shopId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error during complete registration:", err);
    await client.query("ROLLBACK");
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
    console.log("Database connection closed");
  }
}