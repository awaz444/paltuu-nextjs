import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { NO_AVATAR, cdn } from "@/lib/personaStudio/shared";

export const dynamic = "force-dynamic";

/** Voice examples a persona needs before it can sound like a person. */
const MIN_VOICE = 5;
/** Described photos a pet needs before it can start posting. */
const READY_PHOTOS = 5;

/**
 * GET /api/v1/admin/persona-studio/profiles
 * Every persona and pet with the fields that can be edited, plus what is still
 * missing. "Missing" is computed here so the page and any script agree on what
 * complete means.
 */
export async function GET(req: NextRequest) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        const [personas, pets] = await Promise.all([
            db.query(`
                SELECT p.persona_id, p.name, p.social_username, p.bio, p.city, p.avatar_url, p.status,
                       (r.user_id IS NOT NULL) AS seeded,
                       (SELECT count(*) FROM bots.persona_voice_examples v
                         WHERE v.persona_id = p.persona_id AND v.register <> 'never_says')::int AS voice_count,
                       (SELECT count(*) FROM bots.persona_pets x WHERE x.persona_id = p.persona_id)::int AS pet_count
                  FROM bots.personas p
                  LEFT JOIN bots.persona_registry r USING (persona_id)
                 ORDER BY p.persona_id`),
            db.query(`
                SELECT pp.persona_id, pp.pet_slug, pp.name, pp.species, pp.breed, pp.gender, pp.bio,
                       pp.date_of_birth IS NOT NULL AS has_dob, pp.avatar_url,
                       (SELECT count(*) FROM bots.persona_media m
                         WHERE m.persona_id = pp.persona_id AND m.pet_slug = pp.pet_slug AND m.kind = 'post'
                           AND m.note IS NOT NULL AND btrim(m.note) <> '')::int AS described_photos
                  FROM bots.persona_pets pp
                 ORDER BY pp.persona_id, pp.pet_slug`),
        ]);

        const petRows = pets.rows.map((p) => {
            const missing: string[] = [];
            if (!p.breed) missing.push("breed");
            if (!p.bio) missing.push("bio");
            if (!p.has_dob) missing.push("birthday");
            if (!p.avatar_url) missing.push("profile photo");
            if (p.described_photos < READY_PHOTOS) missing.push(`${READY_PHOTOS - p.described_photos} more described photo${READY_PHOTOS - p.described_photos === 1 ? "" : "s"}`);
            return { ...p, avatar_url: cdn(p.avatar_url), missing };
        });

        const personaRows = personas.rows.map((p) => {
            const missing: string[] = [];
            if (!p.name) missing.push("name");
            if (!p.social_username) missing.push("username");
            if (!p.bio) missing.push("bio");
            if (!p.city) missing.push("city");
            if (p.voice_count < MIN_VOICE) missing.push("voice examples");
            if (p.pet_count === 0) missing.push("a pet");
            if (!(p.persona_id in NO_AVATAR) && !p.avatar_url) missing.push("profile photo");
            return {
                ...p,
                avatar_url: cdn(p.avatar_url),
                avatar_optional: p.persona_id in NO_AVATAR,
                missing,
                pets: petRows.filter((x) => x.persona_id === p.persona_id),
            };
        });

        return NextResponse.json({
            personas: personaRows,
            summary: {
                personas_complete: personaRows.filter((p) => p.missing.length === 0).length,
                personas_total: personaRows.length,
                pets_complete: petRows.filter((p) => p.missing.length === 0).length,
                pets_total: petRows.length,
                seeded: personaRows.filter((p) => p.seeded).length,
            },
        });
    } catch (error) {
        console.error("Persona profiles GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
