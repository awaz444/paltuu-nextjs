import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { calculateAge } from "@/utils/age.util";

export const dynamic = "force-dynamic";

const ALLOWED_SPECIES = ["Dog", "Cat", "Bird", "Rabbit", "Fish", "Reptile", "Other"];
const ALLOWED_GENDERS = ["male", "female", "unknown"];
const MAX_PETS_PER_USER = 10;

/**
 * POST /api/v1/pet-profiles
 * Create a personal pet profile.
 * Requires authentication.
 */
export async function POST(req: NextRequest) {
    try {
        const userIdRaw = await getUserIdFromRequest(req);
        if (!userIdRaw) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const userId = parseInt(String(userIdRaw), 10);

        const body = await req.json();
        const { name, species, breed, gender = "unknown", date_of_birth, bio, avatar_url } = body;

        // ── Validation ────────────────────────────────────────────────────────
        const errors: string[] = [];

        if (!name || String(name).trim().length === 0) {
            errors.push("name is required and must not be blank");
        } else if (String(name).trim().length > 100) {
            errors.push("name must be 100 characters or less");
        }

        if (!species || !ALLOWED_SPECIES.includes(species)) {
            errors.push(`species must be one of: ${ALLOWED_SPECIES.join(", ")}`);
        }

        if (!ALLOWED_GENDERS.includes(gender)) {
            errors.push(`gender must be one of: ${ALLOWED_GENDERS.join(", ")}`);
        }

        if (date_of_birth) {
            const dob = new Date(date_of_birth);
            if (isNaN(dob.getTime())) {
                errors.push("date_of_birth must be a valid date");
            } else if (dob > new Date()) {
                errors.push("date_of_birth cannot be in the future");
            }
        }

        if (bio && String(bio).length > 500) {
            errors.push("bio must be 500 characters or less");
        }

        if (errors.length > 0) {
            return NextResponse.json({ errors }, { status: 400 });
        }

        // ── Max 10 pets per user ──────────────────────────────────────────────
        const countRes = await db.query(
            "SELECT COUNT(*) FROM pet_profiles WHERE owner_id = $1",
            [userId]
        );
        if (parseInt(countRes.rows[0].count, 10) >= MAX_PETS_PER_USER) {
            return NextResponse.json(
                { error: `You can have at most ${MAX_PETS_PER_USER} pet profiles` },
                { status: 400 }
            );
        }

        // ── Insert ────────────────────────────────────────────────────────────
        const result = await db.query(
            `INSERT INTO pet_profiles
                (owner_id, name, species, breed, gender, date_of_birth, bio, avatar_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
                userId,
                String(name).trim(),
                species,
                breed || null,
                gender,
                date_of_birth || null,
                bio ? String(bio).trim() : null,
                avatar_url || null,
            ]
        );

        const profile = result.rows[0];
        return NextResponse.json(
            { ...profile, age: calculateAge(profile.date_of_birth) },
            { status: 201 }
        );

    } catch (error) {
        console.error("POST /api/v1/pet-profiles error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
