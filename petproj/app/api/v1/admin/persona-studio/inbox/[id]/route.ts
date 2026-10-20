import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/** POST /api/v1/admin/persona-studio/inbox/:id   Body: { action: 'resolve' | 'reopen', note? } */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json().catch(() => ({}));
        const result =
            body.action === "reopen"
                ? await db.query(
                      `UPDATE bots.human_flags SET resolved_at = NULL, resolved_note = NULL
                        WHERE id = $1 AND resolved_at IS NOT NULL AND reason <> 'declined'`,
                      [params.id]
                  )
                : await db.query(
                      `UPDATE bots.human_flags SET resolved_at = now(), resolved_note = $2
                        WHERE id = $1 AND resolved_at IS NULL`,
                      [params.id, typeof body.note === "string" ? body.note.slice(0, 500) : null]
                  );
        if (result.rowCount === 0) return NextResponse.json({ error: "Already handled, or no such item." }, { status: 404 });
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error("Persona inbox POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
