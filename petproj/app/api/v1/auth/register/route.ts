import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Mobile Registration (v1)
 *     description: Register a new user and return JWT tokens. Requires OTP verification.
 *     tags: [v1 Auth]
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Schema Validation
    const validation = validate(body, {
      email: { required: true, type: 'email' },
      password: { required: true, min: 8 },
      name: { required: true, min: 2 },
      otp: { required: true }
    });

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    const { email, password, name, otp } = body;

    // Rate limiting
    const limiter = await rateLimit(`register:${email}`, 3, 60);
    if (!limiter.success) {
      return NextResponse.json({ message: "Too many attempts. Please try again later." }, { status: 429 });
    }

    // 1. Verify OTP
    const otpResult = await db.query('SELECT * FROM "OTP" WHERE email = $1', [email]);
    if ((otpResult.rowCount ?? 0) === 0) {
      return NextResponse.json({ message: "OTP not found for this email" }, { status: 400 });
    }

    const latestOtp = otpResult.rows[otpResult.rows.length - 1];
    const isOtpValid = await bcrypt.compare(otp.toString(), latestOtp.otp);
    if (!isOtpValid) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // 2. Check if user already exists
    const userExist = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if ((userExist.rowCount ?? 0) > 0) {
      return NextResponse.json({ message: "User already exists" }, { status: 400 });
    }

    // 3. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserResult = await db.query(
      'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING user_id, name, email, role',
      [name, email, hashedPassword, 'regular user']
    );
    const user = newUserResult.rows[0];

    // 4. Clean up OTP
    await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);

    // 5. Generate tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json({
      success: true,
      ...tokens,
      user: {
        id: user.user_id,
        user_id: user.user_id, // Backward compatibility
        email: user.email,
        name: user.name,
        role: user.role,
        profile_image_url: "/default-avatar.png"
      }
    }, { status: 201 });

  } catch (error) {
    console.error("V1 Register error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
