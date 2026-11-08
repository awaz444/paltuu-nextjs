import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { getContact, type ContactKind } from "@/lib/contacts";

export const dynamic = "force-dynamic";

const KINDS: ContactKind[] = ["pet", "clinic", "vet"];

/**
 * GET /api/v1/contact?kind=pet|clinic|vet&id=<id>
 * The phone (and for vets, email) behind a listing, for signed-in users only.
 * Public pages leave these out; see lib/contacts.ts.
 */
export async function GET(req: NextRequest) {
    if (!(await getUserIdFromRequest(req))) {
        return NextResponse.json({ error: "Sign in to see contact details" }, { status: 401 });
    }
    const limited = await rateLimit(req, LIMITS.CONTACT_REVEAL);
    if (limited) return limited;

    const kind = req.nextUrl.searchParams.get("kind") as ContactKind | null;
    const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
    if (!kind || !KINDS.includes(kind) || !id || id.length > 200) {
        return NextResponse.json({ error: "Bad kind or id" }, { status: 400 });
    }

    try {
        const contact = await getContact(kind, id);
        if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(contact, { headers: { "Cache-Control": "private, no-store" } });
    } catch (error) {
        console.error("V1 contact error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
