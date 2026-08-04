import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { parseTakenOn } from "@/lib/photoTakenOn";

export const dynamic = "force-dynamic";

const MAX_PHOTOS_PER_PET = 20;

// ── Helper: check privacy + ownership ─────────────────────────────────────────
async function getProfileAccess(petId: string, viewerIdRaw: string | null) {
    const viewerId = viewerIdRaw ? parseInt(String(viewerIdRaw), 10) : 0;

    const res = await db.query(
        `SELECT pp.pet_profile_id, pp.owner_id, u.is_private,
                EXISTS(
                    SELECT 1 FROM social_follows f
                    WHERE f.follower_id = $2 AND f.following_id = pp.owner_id AND f.status = 'accepted'
                ) AS viewer_is_following
         FROM pet_profiles pp
         JOIN users u ON u.user_id = pp.owner_id
         WHERE pp.pet_profile_id = $1`,
        [petId, viewerId]
    );

    if (res.rowCount === 0) return null;

    const row      = res.rows[0];
    const isOwner  = viewerId !== 0 && viewerId === row.owner_id;
    const isPrivate = row.is_private && !isOwner && !row.viewer_is_following;

    return { ownerId: row.owner_id, isOwner, isPrivate };
}

/**
 * GET /api/v1/pet-profiles/:pet_id/photos
 * Get gallery photos for a pet profile.
 * Auth optional. Respects owner privacy.
 */
export async function GET(
    req: NextRequest,
    { params }: { params: { pet_id: string } }
) {
    try {
        const viewerIdRaw = await getUserIdFromRequest(req);
        const access = await getProfileAccess(params.pet_id, viewerIdRaw);

        if (!access) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (access.isPrivate) {
            return NextResponse.json({ error: "This profile is private" }, { status: 403 });
        }

        // A shadow-hidden polaroid is still returned to its owner, so their
        // gallery looks untouched; everyone else gets the gallery as if it
        // weren't there. The flag itself is never selected — the owner must
        // not be able to tell.
        const result = await db.query(
            `SELECT photo_id, photo_url, caption, ordering, created_at,
                    to_char(taken_on, 'YYYY-MM-DD') AS taken_on
             FROM pet_profile_photos
             WHERE pet_profile_id = $1
               AND ($2::boolean OR is_shadow_hidden = false)
             ORDER BY ordering ASC, created_at ASC`,
            [params.pet_id, access.isOwner]
        );

        return NextResponse.json({ photos: result.rows, total: result.rowCount });

    } catch (error) {
        console.error("GET /api/v1/pet-profiles/[pet_id]/photos error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/pet-profiles/:pet_id/photos
 * Upload a photo to the gallery. Auth required, owner only. Max 20.
 * Expects: { photo_url: string, caption?: string }
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

        const access = await getProfileAccess(params.pet_id, userIdRaw);
        if (!access) {
            return NextResponse.json({ error: "Pet profile not found" }, { status: 404 });
        }
        if (!access.isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { photo_url, caption } = body;

        if (!photo_url || String(photo_url).trim().length === 0) {
            return NextResponse.json({ error: "photo_url is required" }, { status: 400 });
        }

        // Optional — an absent/null taken_on stores as NULL and the client
        // just doesn't render the date chip.
        const takenOn = parseTakenOn(body.taken_on);
        if (!takenOn.ok) {
            return NextResponse.json({ error: takenOn.error }, { status: 400 });
        }

        // ── Max 20 photos check ───────────────────────────────────────────────
        const countRes = await db.query(
            "SELECT COUNT(*) FROM pet_profile_photos WHERE pet_profile_id = $1",
            [params.pet_id]
        );
        if (parseInt(countRes.rows[0].count, 10) >= MAX_PHOTOS_PER_PET) {
            return NextResponse.json(
                { error: `A pet profile can have at most ${MAX_PHOTOS_PER_PET} photos` },
                { status: 400 }
            );
        }

        // Ordering = current count (append to end)
        const ordering = parseInt(countRes.rows[0].count, 10);

        const result = await db.query(
            `INSERT INTO pet_profile_photos (pet_profile_id, photo_url, caption, ordering, taken_on)
             VALUES ($1, $2, $3, $4, $5::date)
             RETURNING photo_id, pet_profile_id, photo_url, caption, ordering, created_at,
                       to_char(taken_on, 'YYYY-MM-DD') AS taken_on`,
            [params.pet_id, String(photo_url).trim(), caption || null, ordering, takenOn.value]
        );

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        console.error("POST /api/v1/pet-profiles/[pet_id]/photos error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
