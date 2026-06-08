import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/pet-profiles/:pet_id/list-for-adoption
 * Convert a personal pet profile into an adoption listing.
 * Auth required, owner only.
 * Idempotent guard: returns 400 ALREADY_LISTED if already converted.
 *
 * Optional body fields:
 *   city_id       — required for the pets listing (if pet_profile has none, must be supplied)
 *   listing_type  — 'adoption' | 'sale' | 'rescue' (defaults to 'adoption')
 *   price         — decimal, defaults to 0
 *   contact_number
 *   description   — overrides bio if provided
 */
export async function POST(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);

        // ── Fetch profile ─────────────────────────────────────────────────────
        const profileRes = await db.query(
            `SELECT pp.*, u.city_id AS owner_city_id
             FROM pet_profiles pp
             JOIN users u ON u.user_id = pp.owner_id
             WHERE pp.pet_profile_id = $1`,
            [params.pet_id]
        );

        if (profileRes.rowCount === 0) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }

        const profile = profileRes.rows[0];

        if (profile.owner_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // ── Idempotent guard ──────────────────────────────────────────────────
        if (profile.is_listed_for_adoption) {
            return NextResponse.json(
                {
                    error: "ALREADY_LISTED",
                    message: "This pet profile is already listed for adoption",
                    adoption_listing_id: profile.adoption_listing_id,
                },
                { status: 400 }
            );
        }

        // ── Body params ───────────────────────────────────────────────────────
        const body = await req.json().catch(() => ({}));
        const {
            listing_type  = "adoption",
            price         = 0,
            contact_number,
            description,
        } = body;

        const cityId = body.city_id || profile.owner_city_id;
        if (!cityId) {
            return NextResponse.json(
                { error: "city_id is required (the pet profile owner has no default city set)" },
                { status: 400 }
            );
        }

        // ── Resolve species → pet_category.category_id ────────────────────────
        const catRes = await db.query(
            "SELECT category_id FROM pet_category WHERE LOWER(category_name) = LOWER($1) LIMIT 1",
            [profile.species]
        );
        if (catRes.rowCount === 0) {
            return NextResponse.json(
                {
                    error: `No matching pet_category found for species '${profile.species}'. ` +
                           `Please ensure a matching category exists in pet_category.`
                },
                { status: 400 }
            );
        }
        const petTypeId = catRes.rows[0].category_id;

        // ── Create adoption listing row in `pets` table ────────────────────────
        await db.query("BEGIN");
        try {
            const petsRes = await db.query(
                `INSERT INTO pets (
                    owner_id, pet_name, pet_type, pet_breed, city_id,
                    description, adoption_status, sex, listing_type,
                    price, contact_number, created_at, approved
                 )
                 VALUES ($1, $2, $3, $4, $5, $6, 'available', $7, $8, $9, $10, NOW(), false)
                 RETURNING pet_id`,
                [
                    userId,
                    profile.name,
                    petTypeId,
                    profile.breed || null,
                    cityId,
                    description || profile.bio || null,
                    // gender: map 'male'/'female'/'unknown' → sex field on pets table
                    profile.gender === "male"   ? "Male"
                    : profile.gender === "female" ? "Female"
                    : null,
                    listing_type,
                    listing_type === "rescue" ? null : parseFloat(price) || 0,
                    contact_number || null,
                ]
            );

            const newPetId = petsRes.rows[0].pet_id;

            // ── Update pet_profile to mark as listed ──────────────────────────
            await db.query(
                `UPDATE pet_profiles
                 SET is_listed_for_adoption = true,
                     adoption_listing_id    = $1,
                     updated_at             = NOW()
                 WHERE pet_profile_id = $2`,
                [newPetId, params.pet_id]
            );

            await db.query("COMMIT");

            return NextResponse.json(
                {
                    success: true,
                    adoption_listing_id: newPetId,
                    message: "Pet profile successfully listed for adoption. Pending admin approval.",
                },
                { status: 201 }
            );

        } catch (e) {
            await db.query("ROLLBACK");
            throw e;
        }

    } catch (error) {
        console.error("POST /api/v1/pet-profiles/[pet_id]/list-for-adoption error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
