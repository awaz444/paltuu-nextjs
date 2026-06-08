import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { calculateAge } from "@/utils/age.util";

export const dynamic = "force-dynamic";

const ALLOWED_SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Reptile", "Other"];
const ALLOWED_GENDERS = ["male", "female", "unknown"];

// ── Helper: resolve profile + privacy gate ────────────────────────────────────
async function resolveProfile(petId: string, viewerIdRaw: string | null) {
    const viewerId = viewerIdRaw ? parseInt(String(viewerIdRaw), 10) : 0;

    const res = await db.query(
        `SELECT
            pp.*,
            u.is_private      AS owner_is_private,
            u.name            AS owner_name,
            u.social_username AS owner_social_username,
            u.profile_image_url AS owner_avatar,
            (SELECT COUNT(*) FROM pet_profile_photos ppp WHERE ppp.pet_profile_id = pp.pet_profile_id)::int AS photo_count,
            (SELECT COUNT(*) FROM post_pet_tags ppt WHERE ppt.pet_profile_id = pp.pet_profile_id)::int       AS tagged_post_count,
            EXISTS(
                SELECT 1 FROM social_follows f
                WHERE f.follower_id = $2 AND f.following_id = pp.owner_id
            ) AS viewer_is_following
         FROM pet_profiles pp
         JOIN users u ON u.user_id = pp.owner_id
         WHERE pp.pet_profile_id = $1`,
        [petId, viewerId]
    );

    if (res.rowCount === 0) return { profile: null, forbidden: false };

    const row = res.rows[0];
    const isOwner    = viewerId !== 0 && viewerId === row.owner_id;
    const isFollower = row.viewer_is_following;
    const isPrivate  = row.owner_is_private && !isOwner && !isFollower;

    return { profile: row, forbidden: isPrivate, isOwner };
}

/**
 * GET /api/v1/pet-profiles/:pet_id
 * Get a single pet profile.
 * Auth optional. Returns 403 if owner is private and requester is not a follower.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const viewerIdRaw = await getUserIdFromRequest(req);
        const { profile, forbidden } = await resolveProfile(params.pet_id, viewerIdRaw);

        if (!profile) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (forbidden) {
            return NextResponse.json({ error: "This profile is private" }, { status: 403 });
        }

        return NextResponse.json({
            ...profile,
            age: calculateAge(profile.date_of_birth),
        });

    } catch (error) {
        console.error("GET /api/v1/pet-profiles/[pet_id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * PATCH /api/v1/pet-profiles/:pet_id
 * Edit pet profile details. Auth required, owner only.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);
        const { profile, isOwner } = await resolveProfile(params.pet_id, userIdRaw);

        if (!profile) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (!isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const errors: string[] = [];

        // Only validate fields that were provided
        if ("name" in body) {
            if (!body.name || String(body.name).trim().length === 0) {
                errors.push("name must not be blank");
            } else if (String(body.name).trim().length > 100) {
                errors.push("name must be 100 characters or less");
            }
        }
        if ("species" in body && !ALLOWED_SPECIES.includes(body.species)) {
            errors.push(`species must be one of: ${ALLOWED_SPECIES.join(", ")}`);
        }
        if ("gender" in body && !ALLOWED_GENDERS.includes(body.gender)) {
            errors.push(`gender must be one of: ${ALLOWED_GENDERS.join(", ")}`);
        }
        if ("date_of_birth" in body && body.date_of_birth) {
            const dob = new Date(body.date_of_birth);
            if (isNaN(dob.getTime())) {
                errors.push("date_of_birth must be a valid date");
            } else if (dob > new Date()) {
                errors.push("date_of_birth cannot be in the future");
            }
        }
        if ("bio" in body && body.bio && String(body.bio).length > 500) {
            errors.push("bio must be 500 characters or less");
        }

        if (errors.length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        // Build partial update
        const fields: string[] = [];
        const values: any[]    = [];
        let   idx              = 1;

        const patchable = ["name", "species", "breed", "gender", "date_of_birth", "bio", "avatar_url"] as const;
        for (const key of patchable) {
            if (key in body) {
                const val = key === "name" || key === "bio"
                    ? (body[key] ? String(body[key]).trim() : null)
                    : body[key];
                fields.push(`${key} = $${idx++}`);
                values.push(val ?? null);
            }
        }

        if (fields.length === 0) {
            return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
        }

        fields.push(`updated_at = NOW()`);
        values.push(parseInt(params.pet_id, 10));

        const result = await db.query(
            `UPDATE pet_profiles SET ${fields.join(", ")}
             WHERE pet_profile_id = $${idx}
             RETURNING *`,
            values
        );

        const updated = result.rows[0];
        return NextResponse.json({ ...updated, age: calculateAge(updated.date_of_birth) });

    } catch (error) {
        console.error("PATCH /api/v1/pet-profiles/[pet_id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * DELETE /api/v1/pet-profiles/:pet_id
 * Delete a pet profile. Auth required, owner only.
 * Cascades to pet_profile_photos and post_pet_tags.
 */
export async function DELETE(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { profile, isOwner } = await resolveProfile(params.pet_id, userIdRaw);

        if (!profile) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (!isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        await db.query(
            "DELETE FROM pet_profiles WHERE pet_profile_id = $1",
            [params.pet_id]
        );

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("DELETE /api/v1/pet-profiles/[pet_id] error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
