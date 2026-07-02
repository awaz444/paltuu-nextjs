import { db } from "@/db/index";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/auth/check-email:
 *   get:
 *     summary: Check whether an email is already registered (V1)
 *     tags: [v1 Auth]
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ message: 'Email required' }, { status: 400 });
    }

    const result = await db.query('SELECT user_id FROM users WHERE email = $1 LIMIT 1', [email]);

    return NextResponse.json({
      email,
      registered: (result.rowCount ?? 0) > 0,
    });
  } catch (error) {
    console.error('V1 Check Email error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
