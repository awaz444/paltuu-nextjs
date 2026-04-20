import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Mobile Login (v1)
 *     description: Authenticate user and return JWT token pair for mobile application.
 *     tags: [v1 Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Schema Validation
    const validation = validate(body, {
      email: { required: true, type: 'email' },
      password: { required: true, min: 3 }
    });

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const { email, password } = body;

    // Rate limiting: 5 attempts per minute per email
    const limiter = await rateLimit(`login:${email}`, 5, 60);
    if (!limiter.success) {
      return NextResponse.json({ message: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    // 1. Fetch user
    const result = await db.query('SELECT user_id, name, email, password, role FROM users WHERE email = $1', [email]);
    
    if (result.rowCount === 0) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0];

    // 2. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // 3. Generate tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    // 4. Return tokens + user info
    return NextResponse.json({
      ...tokens,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 200 });

  } catch (error) {
    console.error("V1 Login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
