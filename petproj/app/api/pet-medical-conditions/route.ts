/**
 * @swagger
 * /api/pet-medical-conditions:
 *   get:
 *     summary: Auto-generated summary for /api/pet-medical-conditions
 *     tags: [Auto-Generated]
 *   post:
 *     summary: Auto-generated summary for /api/pet-medical-conditions
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const { pet_id, medical_conditions } = await req.json();

    if (!pet_id || !medical_conditions || !Array.isArray(medical_conditions)) {
      return NextResponse.json(
        { error: "Pet ID and medical conditions array are required" },
        { status: 400 }
      );
    }

    await client.connect();
    await client.query("BEGIN");

    // Delete existing medical conditions for this pet
    await client.query(
      "DELETE FROM rescue_medical_conditions WHERE pet_id = $1",
      [pet_id]
    );

    // Insert new medical conditions
    for (const condition of medical_conditions) {
      if (condition && condition.condition && condition.condition.trim()) {
        await client.query(
          "INSERT INTO rescue_medical_conditions (pet_id, condition, treatment_cost, treated) VALUES ($1, $2, $3, $4)",
          [
            pet_id, 
            condition.condition.trim(), 
            condition.treatmentCost || null, 
            condition.treated || false
          ]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${medical_conditions.length} medical conditions`,
      pet_id,
      medical_conditions
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving medical conditions:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while saving medical conditions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const { searchParams } = new URL(req.url);
    const petId = searchParams.get('pet_id');

    if (!petId) {
      return NextResponse.json(
        { error: "Pet ID is required" },
        { status: 400 }
      );
    }

    await client.connect();

    const result = await client.query(
      "SELECT condition_id, condition, treatment_cost, treated FROM rescue_medical_conditions WHERE pet_id = $1 ORDER BY condition_id",
      [petId]
    );

    return NextResponse.json({
      success: true,
      medical_conditions: result.rows
    });

  } catch (error) {
    console.error("Error fetching medical conditions:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while fetching medical conditions",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
