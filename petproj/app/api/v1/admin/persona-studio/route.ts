import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { NO_AVATAR, cdn, genderOf } from "@/lib/personaStudio/shared";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/persona-studio
 * Everything the Studio needs for its sidebar in one round trip: who still
 * needs a profile photo, and how close each pet is to being able to post.
 * "Ready" means described, not merely uploaded.
 */
export async function GET(req: NextRequest) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const [personas, pets, flags] = await Promise.all([
            db.query(`SELECT persona_id, name, city, avatar_url, status FROM bots.personas ORDER BY persona_id`),
            db.query(`
                SELECT pp.persona_id, p.name AS persona_name, pp.pet_slug, pp.name, pp.species, pp.breed,
                       pp.avatar_url,
                       count(m.id) FILTER (WHERE m.kind = 'post')::int AS total,
                       count(m.id) FILTER (
                           WHERE m.kind = 'post' AND m.note IS NOT NULL AND btrim(m.note) <> ''
                       )::int AS described,
                       count(m.id) FILTER (
                           WHERE m.kind = 'post' AND m.note IS NOT NULL AND btrim(m.note) <> ''
                             AND (m.last_used_at IS NULL OR m.last_used_at < now() - interval '30 days')
                       )::int AS available
                  FROM bots.persona_pets pp
                  JOIN bots.personas p USING (persona_id)
                  LEFT JOIN bots.persona_media m
                         ON m.persona_id = pp.persona_id AND m.pet_slug = pp.pet_slug
                 GROUP BY pp.persona_id, p.name, pp.pet_slug, pp.name, pp.species, pp.breed, pp.avatar_url
                 ORDER BY pp.persona_id, pp.pet_slug`),
            db.query(`SELECT count(*)::int AS n FROM bots.human_flags WHERE resolved_at IS NULL`),
        ]);

        return NextResponse.json({
            personas: personas.rows.map((p) => ({
                ...p,
                avatar_url: cdn(p.avatar_url),
                gender: genderOf(p.name),
                needs_avatar: !(p.persona_id in NO_AVATAR),
                avatar_reason: NO_AVATAR[p.persona_id] ?? null,
            })),
            pets: pets.rows.map((p) => ({ ...p, avatar_url: cdn(p.avatar_url) })),
            open_flags: flags.rows[0]?.n ?? 0,
        });
    } catch (error) {
        console.error("Persona studio GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
