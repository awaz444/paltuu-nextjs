import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../db/index";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest): Promise<NextResponse> {
  const client = createClient();

  try {
    const { username, name, email, password, phone_number, city_id, role } = await req.json();

    await client.connect();

    // Check if email already exists
    const emailCheck = await client.query(
      "SELECT user_id FROM users WHERE email = $1",
      [email]
    );

    if (emailCheck.rows.length > 0) {
      return NextResponse.json(
        {
          error: "EMAIL_EXISTS",
          message: "This email is already registered",
        },
        { status: 400 }
      );
    }



    // Create user
    const userResult = await client.query(
      `INSERT INTO users (
        username, name, email, password, phone_number, city_id, role, profile_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING user_id`,
      [
        username,
        name,
        email,
        password,
        phone_number,
        city_id,
        role || "regular user",
        "/default-avatar.png",
      ]
    );

    const userId = userResult.rows[0].user_id;

    return NextResponse.json(
      { success: true, user_id: userId },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error during user creation:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: (err as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}