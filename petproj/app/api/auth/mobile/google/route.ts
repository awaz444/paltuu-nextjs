import { db } from "@/db/index";
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /api/auth/mobile/google:
 *   post:
 *     summary: Google OAuth Exchange (Mobile)
 *     description: Exchange a Google ID token for our local mobile JWT tokens.
 *     tags: [Mobile Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken: { type: string }
 *     responses:
 *       200:
 *         description: Google login successful
 *       401:
 *         description: Invalid Google token
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: "ID Token is required" }, { status: 400 });
    }

    // 1. Verify Google ID Token
    // Ideally we'd pass all possible client IDs (Web, iOS, Android) here
    // For now we use the main one.
    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_MOBILE_CLIENT_ID!, // Placeholder for future use
      ].filter(Boolean) as string[],
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ message: "Invalid Google Token" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || "Google User";

    // 2. Check if user exists
    let userResult = await db.query('SELECT user_id, email, role FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rowCount === 0) {
      // 3. Create new user if they don't exist
      const username = email.split('@')[0];
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      const newUserResult = await db.query(
        'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, email, role',
        [username, name, email, placeholderPassword, 'regular user']
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    // 4. Generate tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    return NextResponse.json(tokens, { status: 200 });

  } catch (error) {
    console.error("Mobile Google login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
