import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email, password } = reqBody;
    console.log(reqBody);

    // Check if user exists
    const query = 'SELECT user_id,username, email,role, password FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    const user = rows[0];

    if (!user) {
      return NextResponse.json({ error: "User does not exist" }, { status: 400 });
    }
    console.log("User exists:", user);

    // console.log("Request password:", password);
    // console.log("Database hashed password:", user.password);
    console.log("Request password:", password);
    console.log("Database hashed password:", user.password);
    console.log("Comparison result:", await bcrypt.compare(password, user.password));




    // Check if password is correct
    // const validPassword = await bcrypt.compare(password.trim(), user.password.trim());
    if (password.trim() !== user.password.trim()) {
      return NextResponse.json({ error: "Invalid password" }, { status: 400 });
    }
    console.log("Password validated");

    // Create token data
    const tokenData = {
      id: user.user_id,
      username: user.username,
      email: user.email,
      role:user.role,
    };

    // Create token
    const token = jwt.sign(tokenData, process.env.TOKEN_SECRET!, { expiresIn: "1d" });

    // Set token in cookies
    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      user: {
        id: user.user_id,
        name: user.username,
        email: user.email,
        role: user.role,
      },
    });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24, // 1 day
      path: "/",
    });

    return response;

  } catch (error: any) {
    console.error("Error during login:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
