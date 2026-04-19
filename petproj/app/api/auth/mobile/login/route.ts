import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 });
    }

    // 1. Fetch user
    const result = await db.query('SELECT user_id, email, password, role FROM users WHERE email = $1', [email]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    const user = result.rows[0];

    // 2. Verify password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 });
    }

    // 3. Generate JWT pair
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json(tokens, { status: 200 });

  } catch (error) {
    console.error("Mobile login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
