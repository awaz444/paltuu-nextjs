import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { uploadToS3 } from "@/lib/s3";
import { TIMES_OF_DAY, cdn, keyFromUrl, processImage, sha256 } from "@/lib/personaStudio/shared";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/v1/admin/persona-studio/photos?persona_id=&pet_slug=
 * Post photos, with the ones still needing a description first.
 */
export async function GET(req: NextRequest) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const params = req.nextUrl.searchParams;
    try {
        const { rows } = await db.query(
            `SELECT m.id::text, m.persona_id, p.name AS persona_name, m.pet_slug, pp.name AS pet_name,
                    m.url, m.note, m.time_of_day, m.use_count, m.last_used_at, m.created_at
               FROM bots.persona_media m
               JOIN bots.personas p USING (persona_id)
               LEFT JOIN bots.persona_pets pp
                      ON pp.persona_id = m.persona_id AND pp.pet_slug = m.pet_slug
              WHERE m.kind = 'post'
                AND ($1::text IS NULL OR m.persona_id = $1)
                AND ($2::text IS NULL OR m.pet_slug = $2)
              ORDER BY (m.note IS NULL OR btrim(m.note) = '') DESC, m.created_at DESC
              LIMIT 400`,
            [params.get("persona_id"), params.get("pet_slug")]
        );
        return NextResponse.json(rows.map((r) => ({ ...r, url: cdn(r.url) })));
    } catch (error) {
        console.error("Persona studio photos GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/admin/persona-studio/photos
 * Body: { data: <base64 or data URL>, kind: 'post'|'avatar'|'pet_avatar',
 *         persona_id, pet_slug?, note?, time_of_day? }
 *
 * The browser downsizes before sending (a phone photo is several MB and a
 * serverless request body is capped at 4.5 MB); this re-normalises it, so what
 * lands in S3 is always an upright JPEG.
 */
export async function POST(req: NextRequest) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const body = await req.json();
        const { persona_id: personaId, kind } = body;
        const petSlug: string | null = body.pet_slug ?? null;
        const note: string | null = typeof body.note === "string" && body.note.trim() ? body.note.trim().slice(0, 280) : null;
        const timeOfDay = TIMES_OF_DAY.includes(body.time_of_day) ? body.time_of_day : "any";

        if (!personaId || !["post", "avatar", "pet_avatar"].includes(kind)) {
            return NextResponse.json({ error: "persona_id and a valid kind are required" }, { status: 400 });
        }
        if (typeof body.data !== "string" || body.data.length < 16) {
            return NextResponse.json({ error: "No image" }, { status: 400 });
        }
        if (kind === "pet_avatar" && !petSlug) {
            return NextResponse.json({ error: "pet_slug is required for a pet profile photo" }, { status: 400 });
        }

        const exists = await db.query(`SELECT 1 FROM bots.personas WHERE persona_id = $1`, [personaId]);
        if (exists.rowCount === 0) return NextResponse.json({ error: "No such persona" }, { status: 404 });

        const payload = body.data.startsWith("data:") ? body.data.slice(body.data.indexOf(",") + 1) : body.data;
        let buffer: Buffer;
        try {
            buffer = await processImage(Buffer.from(payload, "base64"), kind !== "post");
        } catch (err) {
            return NextResponse.json({ error: `Could not read that image: ${(err as Error).message}` }, { status: 400 });
        }

        const hash = sha256(buffer);
        const dupe = await db.query(
            `SELECT id::text, url FROM bots.persona_media WHERE persona_id = $1 AND sha256 = $2`,
            [personaId, hash]
        );
        if (dupe.rows[0]) {
            return NextResponse.json({ id: dupe.rows[0].id, url: cdn(dupe.rows[0].url), uploaded: false });
        }

        const url = await uploadToS3(buffer, kind === "post" ? "posts" : "profile-pics", "image/jpeg", "jpg");

        const client = await db.connect();
        try {
            await client.query("BEGIN");
            const inserted = await client.query(
                `INSERT INTO bots.persona_media
                   (persona_id, pet_slug, kind, url, s3_key, source_file, sha256, note, time_of_day)
                 VALUES ($1, $2, $3, $4, $5, 'admin-panel', $6, $7, $8)
                 RETURNING id::text`,
                [personaId, petSlug, kind, url, keyFromUrl(url), hash, note, timeOfDay]
            );

            // A profile photo also has to reach the live account, not just the
            // bots' own tables, or a persona that is already seeded keeps its
            // old face.
            if (kind === "avatar") {
                await client.query(`UPDATE bots.personas SET avatar_url = $2 WHERE persona_id = $1`, [personaId, url]);
                await client.query(
                    `UPDATE users SET profile_image_url = $2
                      WHERE user_id = (SELECT user_id FROM bots.persona_registry WHERE persona_id = $1)`,
                    [personaId, url]
                );
            } else if (kind === "pet_avatar") {
                await client.query(
                    `UPDATE bots.persona_pets SET avatar_url = $3 WHERE persona_id = $1 AND pet_slug = $2`,
                    [personaId, petSlug, url]
                );
                await client.query(
                    `UPDATE pet_profiles SET avatar_url = $3
                      WHERE owner_id = (SELECT user_id FROM bots.persona_registry WHERE persona_id = $1)
                        AND lower(name) = (SELECT lower(name) FROM bots.persona_pets WHERE persona_id = $1 AND pet_slug = $2)`,
                    [personaId, petSlug, url]
                );
            }
            await client.query("COMMIT");
            return NextResponse.json({ id: inserted.rows[0].id, url, uploaded: true }, { status: 201 });
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Persona studio photo POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
