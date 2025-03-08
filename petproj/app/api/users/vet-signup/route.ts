import { db } from "@/db/index";  // Your DB instance
import { NextRequest, NextResponse } from "next/server";

// Define the POST route to handle vet registration
export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const {
      user_id, clinic_name, location, minimum_fee,
      clinic_email, clinic_whatsapp,
      bio, image_url  // We now expect image_url from the frontend
    } = reqBody;

    // Validate required fields
    if (!user_id || !clinic_name || !location || !minimum_fee || !clinic_email || !clinic_whatsapp) {
      return NextResponse.json({
        error: "Missing required fields",
        details: "All fields except bio and image are required"
      }, { status: 400 });
    }

    // Check if the vet already exists (for update scenario)
    const existingVetQuery = `SELECT id FROM vets WHERE user_id = $1`;
    const existingVet = await db.query(existingVetQuery, [user_id]);

    let vetId;

    if (existingVet.rows.length > 0) {
      // If vet exists, update the existing record
      const updateQuery = `
        UPDATE vets
        SET clinic_name = $1, location = $2, minimum_fee = $3,
            clinic_email = $4, clinic_whatsapp = $5,
            bio = $6, image_url = $7
        WHERE user_id = $8
        RETURNING id;
      `;
      const updatedVet = await db.query(updateQuery, [
        clinic_name, location, minimum_fee,
        clinic_email, clinic_whatsapp,
        bio, image_url, user_id
      ]);
      vetId = updatedVet.rows[0].id;
    } else {
      // If vet doesn't exist, insert new record
      const insertQuery = `
        INSERT INTO vets (
          user_id, clinic_name, location, minimum_fee,
          clinic_email, clinic_whatsapp,
          bio, image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id;
      `;
      const insertedVet = await db.query(insertQuery, [
        user_id, clinic_name, location, minimum_fee,
        clinic_email, clinic_whatsapp,
        bio, image_url
      ]);
      vetId = insertedVet.rows[0].id;
    }

    return NextResponse.json({
      vet_id: vetId,
      message: "Vet registered successfully"
    }, { status: 201 });

  } catch (error) {
    console.error("Error handling vet registration:", error);
    return NextResponse.json({
      error: "Internal Server Error",
      details: (error as Error).message
    }, { status: 500 });
  }
}