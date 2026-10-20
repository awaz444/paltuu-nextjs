import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/persona-studio/inbox?state=open|resolved
 * Comments from real people that a persona declined to answer: a question
 * about the app, "are you a bot?", something sad. A person handles these.
 */
export async function GET(req: NextRequest) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const resolved = req.nextUrl.searchParams.get("state") === "resolved";
    try {
        const { rows } = await db.query(
            `SELECT f.id::text, f.persona_id, p.name AS persona_name, f.comment_id::text, f.post_id::text,
                    f.author_id, f.author_name, f.reason, f.content, f.created_at, f.resolved_at, f.resolved_note,
                    left(sp.content, 200) AS post_content
               FROM bots.human_flags f
               JOIN bots.personas p USING (persona_id)
               LEFT JOIN social_posts sp ON sp.post_id = f.post_id
              WHERE ($1::boolean AND f.resolved_at IS NOT NULL AND f.reason <> 'declined')
                 OR (NOT $1::boolean AND f.resolved_at IS NULL)
              ORDER BY f.created_at DESC
              LIMIT 200`,
            [resolved]
        );
        return NextResponse.json(rows);
    } catch (error) {
        console.error("Persona inbox GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
