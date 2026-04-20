import { db } from "@/db/index";
import { generateMobileTokenPair } from "@/utils/mobileAuth";
import { NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @swagger
 * /api/v1/auth/google:
 *   post:
 *     summary: Google OAuth Exchange (v1)
 *     tags: [v1 Auth]
 */
export async function POST(req: Request) {
  try {
    const { idToken } = await req.json();

    if (!idToken) {
      return NextResponse.json({ message: "ID Token is required" }, { status: 400 });
    }

    const ticket = await client.verifyIdToken({
      idToken,
      audience: [
        process.env.GOOGLE_CLIENT_ID!,
        process.env.GOOGLE_MOBILE_CLIENT_ID!,
      ].filter(Boolean) as string[],
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ message: "Invalid Google Token" }, { status: 401 });
    }

    const email = payload.email;
    const name = payload.name || "Google User";

    let userResult = await db.query('SELECT user_id, name, email, role FROM users WHERE email = $1', [email]);
    let user;

    if (userResult.rowCount === 0) {
      const username = email.split('@')[0];
      const placeholderPassword = await bcrypt.hash(Math.random().toString(36), 10);
      
      const newUserResult = await db.query(
        'INSERT INTO users (username, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, role',
        [username, name, email, placeholderPassword, 'regular user']
      );
      user = newUserResult.rows[0];
    } else {
      user = userResult.rows[0];
    }

    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

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
    console.error("V1 Google login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
