import { db } from "@/db/index";
import bcrypt from 'bcryptjs';
import { createHash } from "crypto";
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
    const email = body?.email?.toString().trim().toLowerCase();
    const password = body?.password?.toString();
    
    // Schema Validation
    const validation = validate({ email, password }, {
      email: { required: true, type: 'email' },
      password: { required: true, min: 3 }
    });

    if (!validation.success) {
      return NextResponse.json({ message: "Validation failed", errors: validation.errors }, { status: 400 });
    }

    // Rate limiting: 5 attempts per minute per email
    const limiter = await rateLimit(`login:${email}`, 5, 60);
    if (!limiter.success) {
      return NextResponse.json({ message: "Too many login attempts. Please try again later." }, { status: 429 });
    }

    // 1. Fetch user
    const result = await db.query(
      'SELECT user_id, name, email, password, role, profile_image_url FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    
    if ((result.rowCount ?? 0) === 0) {
      console.warn(`[auth/login] user_not_found email=${email}`);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    const user = result.rows[0];
    

    // 2. Compare password
    // Support both bcrypt-hashed and legacy plain-text passwords.
    // If a legacy password logs in, immediately migrate it to bcrypt.
    const rawInputPassword = typeof password === "string" ? password : "";
    const trimmedInputPassword = rawInputPassword.trim();
    const emailVariants = Array.from(new Set([email, email.trim(), email.toLowerCase()]));
    const legacyComposedCandidates = emailVariants.flatMap((mail) => [
      `${rawInputPassword}${mail}`,
      `${mail}${rawInputPassword}`,
      `${trimmedInputPassword}${mail}`,
      `${mail}${trimmedInputPassword}`,
      `${rawInputPassword}:${mail}`,
      `${mail}:${rawInputPassword}`,
      `${trimmedInputPassword}:${mail}`,
      `${mail}:${trimmedInputPassword}`,
    ]);
    const inputCandidates = Array.from(
      new Set([
        rawInputPassword,
        trimmedInputPassword,
        ...legacyComposedCandidates,
        createHash("sha256").update(rawInputPassword).digest("hex"),
        createHash("sha256").update(trimmedInputPassword).digest("hex"),
        ...legacyComposedCandidates.map((v) => createHash("sha256").update(v).digest("hex")),
        createHash("md5").update(rawInputPassword).digest("hex"),
        createHash("md5").update(trimmedInputPassword).digest("hex"),
        ...legacyComposedCandidates.map((v) => createHash("md5").update(v).digest("hex")),
      ])
    );
    const storedPassword = typeof user.password === "string" ? user.password : "";
    const storedPasswordTrimmed = storedPassword.trim();
    const storedPasswordLower = storedPasswordTrimmed.toLowerCase();
    let isMatch = false;
    let matchedInput = rawInputPassword;
    let didUpgradeHash = false;

    if (storedPasswordTrimmed.startsWith("$2")) {
      const normalizedBcryptHash =
        storedPasswordTrimmed.startsWith("$2y$") || storedPasswordTrimmed.startsWith("$2x$")
          ? `$2b$${storedPasswordTrimmed.slice(4)}`
          : storedPasswordTrimmed;
      for (const candidate of inputCandidates) {
        if (await bcrypt.compare(candidate, normalizedBcryptHash)) {
          isMatch = true;
          matchedInput = candidate;
          break;
        }
      }
    } else {
      for (const candidate of inputCandidates) {
        const md5Hex = createHash("md5").update(candidate).digest("hex");
        const sha256Hex = createHash("sha256").update(candidate).digest("hex");
        if (
          candidate === storedPassword ||
          candidate === storedPasswordTrimmed ||
          md5Hex === storedPasswordLower ||
          sha256Hex === storedPasswordLower
        ) {
          isMatch = true;
          matchedInput = candidate;
          break;
        }
      }

      if (isMatch) {
        const upgradedHash = await bcrypt.hash(trimmedInputPassword || rawInputPassword, 10);
        await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [upgradedHash, user.user_id]);
        didUpgradeHash = true;
      }
    }
    if (!didUpgradeHash && isMatch && matchedInput !== rawInputPassword && matchedInput !== trimmedInputPassword) {
      const upgradedHash = await bcrypt.hash(trimmedInputPassword || rawInputPassword, 10);
      await db.query("UPDATE users SET password = $1 WHERE user_id = $2", [upgradedHash, user.user_id]);
      console.log(`[auth/login] upgraded_legacy_strategy email=${email} user_id=${user.user_id}`);
    }
    if (!isMatch) {
      const kind = storedPasswordTrimmed.startsWith("$2y$")
        ? "bcrypt-2y"
        : storedPasswordTrimmed.startsWith("$2x$")
          ? "bcrypt-2x"
          : storedPasswordTrimmed.startsWith("$2")
        ? "bcrypt"
        : /^[a-f0-9]{32}$/i.test(storedPasswordTrimmed)
          ? "md5"
          : /^[a-f0-9]{64}$/i.test(storedPasswordTrimmed)
            ? "sha256"
            : "plain_or_unknown";
      console.warn(`[auth/login] stored_password kind=${kind} len=${storedPasswordTrimmed.length}`);
      console.warn(`[auth/login] password_mismatch email=${email} user_id=${user.user_id}`);
      return NextResponse.json({ message: "Invalid email or password" }, { status: 401 });
    }

    // 3. Generate tokens
    const tokens = await generateMobileTokenPair({
      user_id: user.user_id,
      email: user.email,
      role: user.role
    });

    // 4. Set httpOnly cookie for Web clients
    const response = NextResponse.json({
      success: true,
      ...tokens,
      user: {
        id: user.user_id,
        user_id: user.user_id, // Backward compatibility
        email: user.email,
        name: user.name,
        role: user.role,
        profile_image_url: user.profile_image_url || "/default-avatar.png"
      }
    }, { status: 200 });

    // Set cookie
    response.cookies.set('token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 7 days (independent of short-lived JWT for safety)
    });

    return response;

  } catch (error) {
    console.error("V1 Login error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 200 });
}
