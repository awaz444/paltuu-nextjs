import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";
import { sendNewShelterAdminNotification } from "../../../../../utils/mailjet";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  console.log("Starting complete registration process...");
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
      shelterName: data.shelterName,
    });

    // Extract all data fields
    const {
      email,
      password,
      name,
      phone_number,
      city_id,
      role,
      shelterName,
      address,
      description,
      accountTitle,
      iban,
      bankName,
      socials,
      animalTypes,
      capacity,
      emergencyPhone,
      backupPhone,
      vetName,
      vetPhone,
      services,
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
        role || "shelter admin",
        "/default-avatar.png",
      ]
    );

    const userId = userResult.rows[0].user_id;
    console.log("User created with ID:", userId);

    // Handle file uploads to Cloudinary
    const logoFile = formData.get("logo") as File | null;
    const photoFiles = formData.getAll("photos") as File[];
    const regCertFile = formData.get("regCert") as File | null;
    const cnicFrontFile = formData.get("cnicFront") as File | null;
    const cnicBackFile = formData.get("cnicBack") as File | null;

    // Upload files to Cloudinary
    const uploadFileToCloudinary = async (file: File | null): Promise<string | null> => {
      if (!file || file.size === 0) return null;

      try {
        console.log("Uploading file to Cloudinary:", file.name);
        const buffer = Buffer.from(await file.arrayBuffer());

        return new Promise<string>((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { resource_type: "image" },
            (error: any, result: any) => {
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

    // Create shelter
    console.log("Creating shelter...");
    const shelterResult = await client.query(
      `INSERT INTO rescue_shelters (
        user_id, shelter_name, address, description,
        logo_url, capacity, approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING shelter_id`,
      [
        userId,
        shelterName,
        address,
        description,
        logoUrl,
        capacity,
        false,
      ]
    );

    const shelterId = shelterResult.rows[0].shelter_id;
    console.log("Shelter created with ID:", shelterId);

    // Upload and save photos
    if (photoFiles && photoFiles.length > 0) {
      console.log("Uploading photos...");
      for (const photo of photoFiles) {
        if (photo.size > 0) {
          const photoUrl = await uploadFileToCloudinary(photo);
          if (photoUrl) {
            await client.query(
              "INSERT INTO shelter_photos (shelter_id, photo_url) VALUES ($1, $2)",
              [shelterId, photoUrl]
            );
          }
        }
      }
    }

    // Save bank info
    console.log("Saving bank info...");
    await client.query(
      `INSERT INTO shelter_bank_info (
        shelter_id, account_title, iban, bank_name
      ) VALUES ($1, $2, $3, $4)`,
      [shelterId, accountTitle, iban, bankName]
    );

    // Save socials
    console.log("Saving socials...");
    await Promise.all(
      ["instagram", "facebook", "website"]
        .filter((platform: any) => socials[platform])
        .map((platform: any) =>
          client.query(
            "INSERT INTO shelter_socials (shelter_id, platform, url) VALUES ($1, $2, $3)",
            [shelterId, platform, socials[platform]]
          )
        )
    );

    // Upload and save verification documents
    console.log("Uploading verification documents...");
    const regCertUrl = await uploadFileToCloudinary(regCertFile);
    const cnicFrontUrl = await uploadFileToCloudinary(cnicFrontFile);
    const cnicBackUrl = await uploadFileToCloudinary(cnicBackFile);

    await client.query(
      `INSERT INTO shelter_verification (
        shelter_id, reg_certificate_url, cnic_front_url, cnic_back_url
      ) VALUES ($1, $2, $3, $4)`,
      [
        shelterId,
        regCertUrl,
        cnicFrontUrl,
        cnicBackUrl,
      ]
    );

    // Save animal types
    console.log("Saving animal types...");
    const animalTypesArray = Array.isArray(animalTypes)
      ? animalTypes
      : JSON.parse(animalTypes);
    await Promise.all(
      animalTypesArray.map((animalType: number) =>
        client.query(
          "INSERT INTO shelter_animals (shelter_id, animal_type) VALUES ($1, $2)",
          [shelterId, animalType]
        )
      )
    );

    // Save emergency contacts
    console.log("Saving emergency contacts...");
    await client.query(
      `INSERT INTO shelter_emergency_contacts (
        shelter_id, primary_phone, backup_phone, vet_name, vet_phone
      ) VALUES ($1, $2, $3, $4, $5)`,
      [shelterId, emergencyPhone, backupPhone, vetName, vetPhone]
    );

    // Save services
    console.log("Saving services...");
    const servicesArray = Array.isArray(services)
      ? services
      : JSON.parse(services);
    await Promise.all(
      servicesArray.map((service: string) =>
        client.query(
          "INSERT INTO shelter_services (shelter_id, service) VALUES ($1, $2)",
          [shelterId, service]
        )
      )
    );

    console.log("Committing transaction...");
    await client.query("COMMIT");

    // Send notification email to admin (non-blocking)
    try {
      // Get city name for the email
      const cityResult = await client.query(
        "SELECT city_name FROM cities WHERE city_id = $1",
        [city_id]
      );
      const cityName = cityResult.rows[0]?.city_name || '';

      sendNewShelterAdminNotification({
        shelter_name: shelterName,
        admin_name: name,
        admin_email: email,
        admin_phone: phone_number,
        city: cityName,
        address: address,
      }).catch((err) => console.warn('Failed to send shelter admin notification', err));
    } catch (e) {
      console.warn('Email notification scheduling failed', e);
    }

    console.log("Registration completed successfully!");
    return NextResponse.json(
      { success: true, userId, shelterId },
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