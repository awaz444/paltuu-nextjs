/**
 * @swagger
 * /api/vet-register-complete:
 *   post:
 *     summary: Auto-generated summary for /api/vet-register-complete
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const {
      // Step 0: Account data
      firstName,
      lastName,
      email,
      password,
      phoneNumber,
      city,
      
      // Step 1: Profile data
      clinicName,
      clinicLocation,
      consultationFee,
      contactNumber,
      bio,
      imageUrl,
      
      // Step 2: Qualifications data
      selectedQualifications,
      qualificationDetails,
      
      // Step 3: Specializations data
      selectedCategories,
      
      // Step 4: Schedule data
      schedules
    } = await req.json();

    await client.connect();
    
    // Start transaction
    await client.query("BEGIN");

    try {
      // Step 1: Create user account
      const name = `${firstName} ${lastName}`.trim();

      // Check if email already exists
      const emailCheck = await client.query(
        "SELECT user_id FROM users WHERE email = $1",
        [email]
      );

      if (emailCheck.rows.length > 0) {
        await client.query("ROLLBACK");
        return NextResponse.json(
          {
            error: "EMAIL_EXISTS",
            message: "This email is already registered",
          },
          { status: 400 }
        );
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const userResult = await client.query(
        `INSERT INTO users (
          name, email, password, phone_number, role, profile_image_url
        ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id`,
        [
          name,
          email,
          hashedPassword,
          phoneNumber,
          "vet",
          imageUrl || "/default-avatar.png",
        ]
      );

      const userId = userResult.rows[0].user_id;

      // Step 2: Create vet profile
      const vetResult = await client.query(
        `INSERT INTO vets 
          (user_id, clinic_name, location, minimum_fee, contact_details, bio, profile_verified, created_at) 
        VALUES 
          ($1, $2, $3, $4, $5, $6, false, CURRENT_TIMESTAMP) 
        RETURNING vet_id`,
        [userId, clinicName, clinicLocation, consultationFee, contactNumber, bio]
      );

      const vetId = vetResult.rows[0].vet_id;

      // Step 3: Add qualifications
      if (selectedQualifications && selectedQualifications.length > 0) {
        for (const qualificationId of selectedQualifications) {
          const details = qualificationDetails?.[qualificationId];
          await client.query(
            `INSERT INTO vet_qualifications 
              (vet_id, qualification_id, year_acquired, note) 
            VALUES ($1, $2, $3, $4)`,
            [
              vetId, 
              qualificationId, 
              details?.yearAcquired || null, 
              details?.note || null
            ]
          );
        }
      }

      // Step 4: Add specializations
      if (selectedCategories && selectedCategories.length > 0) {
        for (const categoryId of selectedCategories) {
          await client.query(
            `INSERT INTO vet_specializations (vet_id, category_id)
            VALUES ($1, $2)`,
            [vetId, categoryId]
          );
        }
      }

      // Step 5: Add schedule
      if (schedules && schedules.length > 0) {
        for (const schedule of schedules) {
          await client.query(
            `INSERT INTO vet_availability 
              (vet_id, day_of_week, start_time, end_time) 
            VALUES ($1, $2, $3, $4)`,
            [vetId, schedule.day, schedule.startTime, schedule.endTime]
          );
        }
      }

      // Commit transaction
      await client.query("COMMIT");

      return NextResponse.json(
        { 
          success: true, 
          user_id: userId, 
          vet_id: vetId,
          message: "Vet registration completed successfully"
        },
        { status: 201 }
      );

    } catch (transactionError) {
      // Rollback transaction on any error
      await client.query("ROLLBACK");
      throw transactionError;
    }

  } catch (err) {
    console.error("Error during vet registration:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}