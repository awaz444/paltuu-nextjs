import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { username, name, DOB, city_id, email, password, phone_number, role } = reqBody;

    console.log(reqBody);

    // Check if the user already exists
    const checkUserQuery = `SELECT * FROM users WHERE email = $1`;
    const { rows: existingUser } = await db.query(checkUserQuery, [email]);

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 });
    }

    // Hash the password
    // const salt = await bcrypt.genSalt(10);
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertUserQuery = `
      INSERT INTO users (username, name, dob, city_id, email, password, phone_number, role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, name, dob, city_id, email, phone_number, role
    `;
    const { rows: savedUser } = await db.query(insertUserQuery, [
      username,
      name,
      DOB,
      city_id,
      email,
      password,
      phone_number,
      role,
    ]);

    const user = savedUser[0];
    console.log(user);

    return NextResponse.json({
      message: "User created successfully",
      success: true,
      user,
    });
  } catch (error: any) {
    console.error("Error creating user:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
