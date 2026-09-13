import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Returns the requester's city as inferred by Vercel's edge network.
 *
 * Used for exactly one thing: deciding whether to show the Karachi "Vets at
 * Home" banner. It is deliberately a separate endpoint rather than a headers()
 * call inside app/page.tsx — reading headers there would opt the homepage into
 * per-request dynamic rendering and cost us the static/ISR CDN cache on the
 * most-crawled page on the site.
 *
 * Never use this for auth, pricing, or gating: it is a hint, and it is trivially
 * wrong behind a VPN.
 */
export async function GET(req: NextRequest) {
    const raw = req.headers.get("x-vercel-ip-city");

    // Vercel URL-encodes the city header ("Dera%20Ghazi%20Khan").
    let city: string | null = null;
    if (raw) {
        try {
            city = decodeURIComponent(raw);
        } catch {
            city = raw;
        }
    }

    // Localhost has no Vercel headers. Default to Karachi in dev so the banner
    // is actually visible while developing — otherwise it silently never renders
    // and nobody notices it is broken. Override with ?city= or DEV_GEO_CITY.
    if (!city && process.env.NODE_ENV !== "production") {
        city =
            req.nextUrl.searchParams.get("city") ??
            process.env.DEV_GEO_CITY ??
            "Karachi";
    }

    // In production a missing header simply means no banner — fail closed.
    const isKarachi = city?.trim().toLowerCase() === "karachi";

    return NextResponse.json(
        { city, isKarachi },
        {
            headers: {
                // next.config.mjs puts Access-Control-Allow-Origin:* on /api/:path*.
                // A shared-cache hit here would hand one visitor's city to everyone.
                "Cache-Control": "private, no-store, max-age=0",
            },
        }
    );
}
