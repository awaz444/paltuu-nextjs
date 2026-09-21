import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { checkBio, checkBreed, checkPetName } from "@/lib/personaStudio/profileRules";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/v1/admin/persona-studio/profiles/:id/pets/:slug
 * Body: any of { name, breed, bio }
 *
 * The bots find a persona's pet_profiles row by owner and NAME, so a rename
 * has to change both records together or posts silently stop tagging the pet.
 * That is why this is one transaction and not two calls.
 */
export async function PATCH(req: NextRequest, { params }: { params: { id: string; slug: string } }) {
    const admin = await checkAdmin(req);
    if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const set: Record<string, string | null> = {};

    if ("name" in body) {
        const r = checkPetName(body.name);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "name" }, { status: 400 });
        set.name = r.value;
    }
    if ("breed" in body) {
        const r = checkBreed(body.breed);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "breed" }, { status: 400 });
        set.breed = r.value;
    }
    if ("bio" in body) {
        const r = checkBio(body.bio, 300);
        if (!r.ok) return NextResponse.json({ error: r.error, field: "bio" }, { status: 400 });
        set.bio = r.value;
    }
    if (Object.keys(set).length === 0) return NextResponse.json({ error: "Nothing to change." }, { status: 400 });

    const client = await db.connect();
    try {
        await client.query("BEGIN");

        const pet = await client.query(
            `SELECT pp.name, r.user_id
               FROM bots.persona_pets pp LEFT JOIN bots.persona_registry r USING (persona_id)
              WHERE pp.persona_id = $1 AND pp.pet_slug = $2 FOR UPDATE OF pp`,
            [params.id, params.slug]
        );
        if (!pet.rows[0]) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: "No such pet" }, { status: 404 });
        }
        const oldName: string = pet.rows[0].name;
        const userId: number | null = pet.rows[0].user_id;

        if (set.name) {
            const clash = await client.query(
                `SELECT 1 FROM bots.persona_pets WHERE persona_id = $1 AND pet_slug <> $2 AND lower(name) = lower($3)`,
                [params.id, params.slug, set.name]
            );
            if ((clash.rowCount ?? 0) > 0) {
                await client.query("ROLLBACK");
                return NextResponse.json({ error: "This persona already has a pet with that name.", field: "name" }, { status: 409 });
            }
        }

        const cols = Object.keys(set);
        await client.query(
            `UPDATE bots.persona_pets SET ${cols.map((c, i) => `${c} = $${i + 3}`).join(", ")} WHERE persona_id = $1 AND pet_slug = $2`,
            [params.id, params.slug, ...cols.map((c) => set[c])]
        );

        let synced = false;
        if (userId !== null) {
            const updated = await client.query(
                `UPDATE pet_profiles SET ${cols.map((c, i) => `${c} = $${i + 3}`).join(", ")}
                  WHERE owner_id = $1 AND lower(name) = lower($2)`,
                [userId, oldName, ...cols.map((c) => set[c])]
            );
            synced = (updated.rowCount ?? 0) > 0;
        }

        await client.query("COMMIT");
        return NextResponse.json({ ok: true, synced, ...set });
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        console.error("Persona pet PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    } finally {
        client.release();
    }
}
