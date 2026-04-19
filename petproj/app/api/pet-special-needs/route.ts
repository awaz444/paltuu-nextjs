/**
 * @swagger
 * /api/pet-special-needs:
 *   get:
 *     summary: Auto-generated summary for /api/pet-special-needs
 *     tags: [Auto-Generated]
 *   post:
 *     summary: Auto-generated summary for /api/pet-special-needs
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const { pet_id, special_needs } = await req.json();

    if (!pet_id || !special_needs || !Array.isArray(special_needs)) {
      return NextResponse.json(
        { error: "Pet ID and special needs array are required" },
        { status: 400 }
      );
    }

    await client.connect();
    await client.query("BEGIN");

    // Delete existing special needs for this pet
    await client.query(
      "DELETE FROM rescue_special_needs WHERE pet_id = $1",
      [pet_id]
    );

    // Insert new special needs
    for (const need of special_needs) {
      if (need && need.trim()) {
        await client.query(
          "INSERT INTO rescue_special_needs (pet_id, special_need) VALUES ($1, $2)",
          [pet_id, need.trim()]
        );
      }
    }

    await client.query("COMMIT");

    return NextResponse.json({
      success: true,
      message: `Successfully saved ${special_needs.length} special needs`,
      pet_id,
      special_needs
    });

  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error saving special needs:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while saving special needs",
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
      "SELECT need_id, special_need FROM rescue_special_needs WHERE pet_id = $1 ORDER BY need_id",
      [petId]
    );

    return NextResponse.json({
      success: true,
      special_needs: result.rows
    });

  } catch (error) {
    console.error("Error fetching special needs:", error);
    return NextResponse.json(
      { 
        error: "Internal server error while fetching special needs",
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}
