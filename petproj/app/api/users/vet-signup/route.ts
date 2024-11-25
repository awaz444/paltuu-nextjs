import { db } from "@/db/index";  // Your DB instance
import { NextRequest, NextResponse } from "next/server";

// Define the POST route to handle vet registration
export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const reqBody = await request.json();
    const { user_id, clinic_name, location, minimum_fee, contact_details, bio } = reqBody;

    // Validate required fields
    if (!user_id || !clinic_name || !location || !minimum_fee || !contact_details) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Prepare the SQL query to insert the vet registration data
    const query = `
      INSERT INTO vets (user_id, clinic_name, location, minimum_fee, contact_details, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id;
    `;

    // Insert data into the database
    const { rows } = await db.query(query, [
      user_id,
      clinic_name,
      location,
      minimum_fee,
      contact_details,
      bio || null, // If bio is not provided, insert null
    ]);

    // Check if insertion was successful
    if (rows.length > 0) {
      const vetId = rows[0].id;
      return NextResponse.json({
        message: "Vet registration successful",
        vetId,
      });
    } else {
      return NextResponse.json({ error: "Failed to register vet" }, { status: 500 });
    }

  } catch (error: any) {
    console.error("Error during vet registration:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
