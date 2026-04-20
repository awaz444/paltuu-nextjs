import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";

/**
 * @swagger
 * /api/auth/mobile/register:
 *   post:
 *     summary: Mobile Registration (with OTP)
 *     description: Register a new user by providing email, password, name, and a valid OTP code.
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *               name: { type: string }
 *               otp: { type: string }
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Missing fields or invalid/expired OTP
 */
export async function POST(req: Request) {
  try {
    const { email, password, name, otp } = await req.json();

    if (!email || !password || !name || !otp) {
      return NextResponse.json({ message: "All fields and OTP are required" }, { status: 400 });
    }

    // Rate limiting: 3 attempts per minute per email
    const limiter = await rateLimit(`register:${email}`, 3, 60);
    if (!limiter.success) {
      return NextResponse.json({ message: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

    // 1. Verify OTP using direct SQL
    const otpResult = await db.query('SELECT * FROM "OTP" WHERE email = $1', [email]);
    
    if (otpResult.rowCount === 0) {
      return NextResponse.json({ message: "OTP Not Found or Invalid" }, { status: 400 });
    }

    const storedOtp = otpResult.rows[0];
    const createdAt = new Date(storedOtp.createdat);
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    if (createdAt < fiveMinutesAgo) {
      await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);
      return NextResponse.json({ message: "OTP Expired" }, { status: 400 });
    }

    const isOtpMatch = await bcrypt.compare(otp.toString(), storedOtp.otp);
    if (!isOtpMatch) {
      return NextResponse.json({ message: "Invalid OTP" }, { status: 400 });
    }

    // 2. Check if user already exists
    const userResult = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (userResult.rowCount! > 0) {
      return NextResponse.json({ message: "Email already registered" }, { status: 409 });
    }

    // 3. Create user
    const hashedPassword = await bcrypt.hash(password, 10);
    const username = email.split('@')[0];
    
    const newUserResult = await db.query(
      'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role',
      [username, name, email, hashedPassword, 'regular user']
    );
    
    const newUser = newUserResult.rows[0];

    // 4. Generate JWT pair
    const tokens = await generateMobileTokenPair({
      user_id: newUser.user_id,
      email: newUser.email,
      role: newUser.role
    });

    // 5. Cleanup OTP
    await db.query('DELETE FROM "OTP" WHERE email = $1', [email]);

    return NextResponse.json({
      ...tokens,
      user: {
        id: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    }, { status: 201 });

  } catch (error) {
    console.error("Mobile registration error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
