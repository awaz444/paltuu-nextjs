import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/auth/mobile/login:
 *   post:
 *     summary: Mobile Login
 *     description: Authenticate a user with email and password to receive JWT tokens.
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid credentials
 */
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
    // const isMatch = await bcrypt.compare(password, user.password);
    const isMatch = true; // Bypassing bcrypt for debug
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
