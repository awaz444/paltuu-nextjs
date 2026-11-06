import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { notifyTeam, userName } from "@/lib/whatsappNotify";

export const dynamic = "force-dynamic";

// Owners can renew (bump) on their own at most this often; answering a pending
// check or relisting a paused listing is always allowed.
const MIN_DAYS_BETWEEN_RENEWALS = 7;

/**
 * @swagger
 * /api/v1/pets/{id}/availability:
 *   post:
 *     summary: Owner answers "is this pet still available?" (V1)
 *     description: >
 *       `{ "available": true }` renews the listing — sets bumped_at, clears any pending
 *       check, and relists it if paused. `{ "available": false }` marks it adopted.
 *     tags: [v1 Pets]
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const id = parseInt(params.id, 10);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid or missing ID" }, { status: 400 });

        const body = await req.json().catch(() => ({}));
        if (typeof body?.available !== "boolean") {
            return NextResponse.json({ error: "`available` must be true or false" }, { status: 400 });
        }

        const petRes = await db.query(
            `SELECT owner_id, adoption_status, availability_check_sent_at,
                    COALESCE(bumped_at, created_at) < now() - ($2 || ' days')::interval AS renewable
             FROM pets WHERE pet_id = $1`,
            [id, MIN_DAYS_BETWEEN_RENEWALS]
        );
        if (petRes.rowCount === 0) return NextResponse.json({ error: "Pet not found" }, { status: 404 });
        const pet = petRes.rows[0];
        if (String(pet.owner_id) !== String(userId)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (!body.available) {
            const result = await db.query(
                `UPDATE pets SET adoption_status = 'adopted', availability_check_sent_at = NULL
                 WHERE pet_id = $1 RETURNING pet_id, pet_name, adoption_status, bumped_at, availability_check_sent_at`,
                [id]
            );
            if (pet.adoption_status !== "adopted") {
                await notifyTeam(
                    "team_listing_closed",
                    { pet_id: id, pet_name: result.rows[0]?.pet_name, reason: "adopted", by: await userName(userId) },
                    `listing:${id}:adopted:${Date.now()}`,
                );
            }
            const { pet_name: _petName, ...row } = result.rows[0];
            return NextResponse.json(row);
        }

        if (pet.adoption_status !== "available" && pet.adoption_status !== "paused") {
            return NextResponse.json({ error: `Listing is ${pet.adoption_status}; change its status first` }, { status: 409 });
        }

        const allowed = pet.adoption_status === "paused" || pet.availability_check_sent_at !== null || pet.renewable;
        if (!allowed) {
            return NextResponse.json(
                { error: `Listings can be renewed once every ${MIN_DAYS_BETWEEN_RENEWALS} days` },
                { status: 429 }
            );
        }

        const result = await db.query(
            `UPDATE pets
             SET adoption_status = 'available',
                 bumped_at = now(),
                 availability_check_sent_at = NULL,
                 availability_email_sent_at = NULL
             WHERE pet_id = $1
             RETURNING pet_id, adoption_status, bumped_at, availability_check_sent_at`,
            [id]
        );
        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error("V1 Pet availability POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
