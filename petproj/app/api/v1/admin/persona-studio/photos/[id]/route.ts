import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { deleteFromS3 } from "@/lib/s3";
import { TIMES_OF_DAY } from "@/lib/personaStudio/shared";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/persona-studio/photos/:id
 * Body: { note?, time_of_day?, pet_slug? }
 *
 * The note is what makes a photo eligible to be posted, so an empty one is
 * stored as NULL rather than as a blank string that would look described.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const hasNote = "note" in body;
        const note = typeof body.note === "string" ? body.note.trim().slice(0, 280) : null;
        const timeOfDay = TIMES_OF_DAY.includes(body.time_of_day) ? body.time_of_day : null;
        const hasPet = "pet_slug" in body;

        const { rows } = await db.query(
            `UPDATE bots.persona_media
                SET note        = CASE WHEN $2::boolean THEN NULLIF($3, '') ELSE note END,
                    time_of_day = COALESCE($4, time_of_day),
                    pet_slug    = CASE WHEN $5::boolean THEN $6 ELSE pet_slug END
              WHERE id = $1
          RETURNING id::text, note, time_of_day, pet_slug`,
            [params.id, hasNote, note, timeOfDay, hasPet, body.pet_slug ?? null]
        );
        if (!rows[0]) return NextResponse.json({ error: "No such photo" }, { status: 404 });
        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error("Persona studio photo PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/** DELETE /api/v1/admin/persona-studio/photos/:id */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const { rows } = await db.query(`SELECT url, use_count FROM bots.persona_media WHERE id = $1`, [params.id]);
        const media = rows[0];
        if (!media) return NextResponse.json({ error: "No such photo" }, { status: 404 });

        await db.query(`DELETE FROM bots.persona_media WHERE id = $1`, [params.id]);

        // A photo already used in a live post stays in S3: deleting the object
        // would leave a broken image on a post that is visible in the feed.
        if (media.use_count === 0) await deleteFromS3(media.url).catch(() => undefined);
        return NextResponse.json({ ok: true, deletedFromS3: media.use_count === 0 });
    } catch (error) {
        console.error("Persona studio photo DELETE error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
