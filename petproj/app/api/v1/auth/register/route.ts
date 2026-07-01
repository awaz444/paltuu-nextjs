import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { validate } from "@/utils/validation";
import { generateUniqueHandle } from "@/utils/usernameValidation";

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
    const email = body?.email?.toString().trim().toLowerCase();
    const password = body?.password?.toString();
    const name = body?.name?.toString().trim();
    const otp = body?.otp;

    // Schema Validation
    const validation = validate({ email, password, name, otp }, {
      email: { required: true, type: 'email' },
      password: { required: true, min: 8 },
      name: { required: true, min: 2 },
      otp: { required: true }
    });

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.errors }, { status: 400 });
    }

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

    // 3. Auto-generate a unique social_username from the user's display name
    const socialUsername = await generateUniqueHandle(
      name,
      async (candidate) => {
        const res = await db.query(
          'SELECT 1 FROM users WHERE LOWER(social_username) = $1 LIMIT 1',
          [candidate]
        );
        return (res.rowCount ?? 0) > 0;
      }
    );

    // 4. Create user (with auto-generated handle)
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUserResult = await db.query(
      'INSERT INTO users (name, email, password, role, social_username) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role, social_username',
      [name, email, hashedPassword, 'regular user', socialUsername]
    );
    const user = newUserResult.rows[0];

    // 4b. Create Default "All Posts" Collection
    await db.query(
      'INSERT INTO save_collections (user_id, name, is_default) VALUES ($1, $2, $3)',
      [user.user_id, 'All Posts', true]
    );

    // 5. Clean up OTP
    await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);

    // 6. Generate tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    const response = NextResponse.json({
      success: true,
      ...tokens,
      user: {
        id: user.user_id,
        user_id: user.user_id, // Backward compatibility
        email: user.email,
        name: user.name,
        role: user.role,
        social_username: user.social_username,
        profile_image_url: "/default-avatar.png"
      }
    }, { status: 201 });

    // Set cookie for web clients
    response.cookies.set('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    console.error("V1 Register error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}