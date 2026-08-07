import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/utils/rateLimit";
import { validateUsername } from "@/utils/usernameValidation";
import { hasSevereIdentityMatch } from "@/lib/moderation/badWords";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/username/check?q=<handle>
 *
 * Real-time username availability check — no auth required.
 *
 * Response shape:
 *   { valid: true,  available: true  }   — handle is valid and free
 *   { valid: true,  available: false }   — handle is valid but taken
 *   { valid: false, error: "…"       }   — handle fails format rules
 *
 * Rate limit: 10 requests per 30 seconds per IP.
 */
export async function GET(req: NextRequest) {
    // ── Rate limiting ─────────────────────────────────────────────────────────
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
        req.headers.get("x-real-ip") ??
        "unknown";

    const limiter = await rateLimit(`username_check:${ip}`, 10, 30);
    if (!limiter.success) {
        return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            {
                status: 429,
                headers: { "Retry-After": "30" },
            }
        );
    }

    // ── Parse query param ─────────────────────────────────────────────────────
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? "";

    if (!q) {
        return NextResponse.json(
            { valid: false, error: "Query parameter 'q' is required." },
            { status: 400 }
        );
    }

    // ── Format validation ─────────────────────────────────────────────────────
    const validation = validateUsername(q);
    if (!validation.valid) {
        return NextResponse.json({ valid: false, error: validation.error });
    }

    if (hasSevereIdentityMatch(q)) {
        return NextResponse.json({ valid: false, error: "This username isn't available." });
    }

    const normalised = validation.normalised!;

    // ── Availability check (case-insensitive) ─────────────────────────────────
    const result = await db.query(
        "SELECT 1 FROM users WHERE LOWER(social_username) = $1 LIMIT 1",
        [normalised]
    );

    const available = (result.rowCount ?? 0) === 0;

    return NextResponse.json({ valid: true, available, handle: normalised });
}
