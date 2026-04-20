/**
 * @swagger
 * /api/bazaar/shipping-info:
 *   get:
 *     summary: Auto-generated summary for /api/bazaar/shipping-info
 *     tags: [Auto-Generated]
 *   post:
 *     summary: Auto-generated summary for /api/bazaar/shipping-info
 *     tags: [Auto-Generated]
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../db/index";
import { getUserIdFromRequest } from "../../../../utils/authServer";

export const revalidate = 0;

// GET - Retrieve saved shipping info for a user
export async function GET(request: NextRequest) {
  const pool = db;

  try {
    // Extract userId from server-side cookie (secure)
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('📥 Get Shipping Info - Authenticated userId:', userId);

    const result = await pool.query(
      `SELECT
        shipping_info_id,
        email,
        full_name,
        phone,
        city,
        postal_code,
        address,
        is_default,
        created_at,
        updated_at
       FROM bazaar_user_shipping_info
       WHERE user_id = $1
       ORDER BY is_default DESC, updated_at DESC
       LIMIT 1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { shippingInfo: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { shippingInfo: result.rows[0] },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching shipping info:", error);
    return NextResponse.json(
      { error: "Failed to fetch shipping information" },
      { status: 500 }
    );
  }
}

// POST - Save or update shipping info for a user
export async function POST(request: NextRequest) {
  const pool = db;

  try {
    // Extract userId from server-side cookie (secure)
    const userId = await getUserIdFromRequest(request);

    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { email, fullName, phone, city, postalCode, address } = body;

    console.log('📥 Save Shipping Info - Authenticated userId:', userId);

    // Validation
    if (!email || !fullName || !phone || !address) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user already has shipping info
    const existingInfo = await pool.query(
      `SELECT shipping_info_id FROM bazaar_user_shipping_info WHERE user_id = $1 LIMIT 1`,
      [userId]
    );

    let result;
    if (existingInfo.rows.length > 0) {
      // Update existing shipping info
      result = await pool.query(
        `UPDATE bazaar_user_shipping_info
         SET email = $1,
             full_name = $2,
             phone = $3,
             city = $4,
             postal_code = $5,
             address = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $7
         RETURNING *`,
        [email, fullName, phone, city, postalCode, address, userId]
      );
    } else {
      // Insert new shipping info
      result = await pool.query(
        `INSERT INTO bazaar_user_shipping_info
         (user_id, email, full_name, phone, city, postal_code, address, is_default)
         VALUES ($1, $2, $3, $4, $5, $6, $7, true)
         RETURNING *`,
        [userId, email, fullName, phone, city, postalCode, address]
      );
    }

    return NextResponse.json(
      {
        message: "Shipping information saved successfully",
        shippingInfo: result.rows[0]
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error saving shipping info:", error);
    return NextResponse.json(
      { error: "Failed to save shipping information" },
      { status: 500 }
    );
  }
}
