import type { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import { getToken } from "next-auth/jwt";

// Quiet version of utils/authServer's lookup: beacons fire on every page, so an
// expired cookie must not log an error each time — it just means "signed out".
export async function signedInUserId(req: NextRequest): Promise<number | null> {
    let raw: unknown = null;
    try {
        const token = await getToken({
            req: req as any,
            secret: process.env.NEXTAUTH_SECRET!,
            secureCookie: req.nextUrl.protocol === "https:" || req.headers.get("x-forwarded-proto") === "https",
        });
        raw = token?.user_id ?? token?.id ?? token?.sub ?? null;
    } catch { /* not signed in via NextAuth */ }

    const cookie = req.cookies.get("token")?.value;
    if (!raw && cookie) {
        try {
            const decoded = jwt.verify(cookie, process.env.TOKEN_SECRET!) as { id?: unknown; user_id?: unknown };
            raw = decoded.id ?? decoded.user_id ?? null;
        } catch { /* expired or invalid — treat as signed out */ }
    }

    const id = Number(raw);
    return Number.isInteger(id) && id > 0 ? id : null;
}
