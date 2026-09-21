import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { checkBio, checkCity, checkPersonaName, checkUsername } from "@/lib/personaStudio/profileRules";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/persona-studio/profiles/:id
 * Body: any of { name, social_username, bio, city }
 *
 * Writes the persona's own record and, when the persona has been seeded, the
 * live account in `users` in the same transaction, so the two can never
 * disagree about who this person is.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const set: Record<string, string | null> = {};

    if ("name" in body) {
        const r = checkPersonaName(body.name);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "name" }, { status: 400 });
        set.name = r.value;
    }
    if ("social_username" in body) {
        const r = checkUsername(body.social_username);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "social_username" }, { status: 400 });
        set.social_username = r.value;
    }
    if ("bio" in body) {
        const r = checkBio(body.bio, 160);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "bio" }, { status: 400 });
        set.bio = r.value;
    }
    if ("city" in body) {
        const r = checkCity(body.city);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "city" }, { status: 400 });
        set.city = r.value;
    }
    if (Object.keys(set).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const current = await client.query(
            `SELECT p.persona_id, r.user_id
               FROM bots.personas p LEFT JOIN bots.persona_registry r USING (persona_id)
              WHERE p.persona_id = $1 FOR UPDATE OF p`,
            [params.id]
        );
        if (!current.rows[0]) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "No such persona" }, { status: 404 });
        }
        const userId: number | null = current.rows[0].user_id;

        if (set.social_username) {
            const taken = await client.query(
                `SELECT 1 FROM users WHERE lower(social_username) = $1 AND user_id <> COALESCE($2, -1)
                 UNION ALL
                 SELECT 1 FROM bots.personas WHERE lower(social_username) = $1 AND persona_id <> $3`,
                [set.social_username, userId, params.id]
            );
            if ((taken.rowCount ?? 0) > 0) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: "That username is already taken.", field: "social_username" }, { status: 409 });
            }
        }

        // Column names come from the fixed validation block above, never from the request.
        const cols = Object.keys(set);
        const values = cols.map((c) => set[c]);
        await client.query(
            `UPDATE bots.personas SET ${cols.map((c, i) => `${c} = $${i + 2}`).join(", ")}, updated_at = now() WHERE persona_id = $1`,
            [params.id, ...values]
        );

        let synced = false;
        const userCols = cols.filter((c) => c !== "city"); // users.city is a lookup id, not text
        if (userId !== null && userCols.length > 0) {
            await client.query(
                `UPDATE users SET ${userCols.map((c, i) => `${c} = $${i + 2}`).join(", ")} WHERE user_id = $1`,
                [userId, ...userCols.map((c) => set[c])]
            );
            synced = true;
        }

        await client.query("COMMIT");
        return NextResponse.json({ ok: true, synced, ...set });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        console.error("Persona profile PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        client.release();
    }
}
