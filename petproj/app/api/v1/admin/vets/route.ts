import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/utils/authServer";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

/**
 * @swagger
 * /api/v1/admin/vets:
 *   get:
 *     summary: Admin view of all vets (V1 Hardened)
 *     tags: [v1 Admin]
 *   post:
 *     summary: Admin create new vet (V1 Hardened)
 *     tags: [v1 Admin]
 *   patch:
 *     summary: Update vet profile (V1 Hardened)
 *     tags: [v1 Admin]
 *   delete:
 *     summary: Delete vet profile (V1 Hardened)
 *     tags: [v1 Admin]
 */

export async function GET(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
        }

        const query = `
            SELECT 
                v.*, u.name, u.email, u.profile_image_url, u.phone_number
            FROM vets v
            JOIN users u ON v.user_id = u.user_id
            ORDER BY v.created_at DESC
        `;

        const result = await db.query(query);
        return NextResponse.json(result.rows);
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * Columns of `vets` the /manage-clinics vet form edits. The vet's name and
 * photo live on their users row. (PALTU-121: this used to write clinic_name and
 * profile_verified, which the vets table doesn't have, so every save 500'd.)
 */
const VET_FIELDS = ["minimum_fee", "contact_details", "license_number", "specialization", "qualifications", "bio", "is_active"] as const;

function vetValue(field: (typeof VET_FIELDS)[number], value: unknown) {
    if (field === "is_active") return value === null ? true : Boolean(value);
    if (field === "minimum_fee") {
        if (value === "" || value === null) return null;
        const fee = Number(value);
        return Number.isFinite(fee) ? Math.round(fee) : null;
    }
    if (typeof value === "string") return value.trim() || null;
    return value ?? null;
}

export async function POST(req: NextRequest) {
    try {
        const adminUser = await getUserFromRequest(req);
        if (!adminUser || adminUser.role !== 'admin') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const body = await req.json();
        const name = typeof body.name === "string" ? body.name.trim() : "";
        const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
        if (!name || !email) return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
        const profileImageUrl = typeof body.profile_image_url === "string" ? body.profile_image_url : null;

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Reuse an existing account with this email instead of failing on the unique email.
            const existing = await client.query(
                `SELECT u.user_id, v.vet_id
                   FROM users u LEFT JOIN vets v ON v.user_id = u.user_id
                  WHERE LOWER(u.email) = $1
                  LIMIT 1`,
                [email]
            );

            let userId: number;
            let tempPassword: string | null = null;
            if (existing.rows[0]) {
                if (existing.rows[0].vet_id) {
                    await client.query('ROLLBACK');
                    return NextResponse.json({ error: "This email already has a vet profile" }, { status: 409 });
                }
                userId = existing.rows[0].user_id;
                // Ordinary accounts become vets; never demote an admin or another panel role.
                await client.query(
                    `UPDATE users
                        SET role = CASE WHEN role IS NULL OR role = 'regular user' THEN 'vet' ELSE role END,
                            profile_image_url = COALESCE($2, profile_image_url)
                      WHERE user_id = $1`,
                    [userId, profileImageUrl]
                );
            } else {
                tempPassword = randomBytes(9).toString("base64url");
                const hashed = await bcrypt.hash(tempPassword, 10);
                const userRes = await client.query(
                    `INSERT INTO users (name, email, password, role, profile_image_url, created_at)
                     VALUES ($1, $2, $3, 'vet', $4, CURRENT_TIMESTAMP)
                     RETURNING user_id`,
                    [name, email, hashed, profileImageUrl]
                );
                userId = userRes.rows[0].user_id;
            }

            const vetRes = await client.query(
                `INSERT INTO vets (user_id, ${VET_FIELDS.join(", ")}, created_at)
                 VALUES ($1, ${VET_FIELDS.map((_, i) => `$${i + 2}`).join(", ")}, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [userId, ...VET_FIELDS.map((f) => vetValue(f, body[f] === undefined ? null : body[f]))]
            );

            await client.query('COMMIT');
            return NextResponse.json({
                message: "Vet account created",
                vet: vetRes.rows[0],
                // Only a new account gets a password; an existing one keeps theirs.
                ...(tempPassword ? { temp_password: tempPassword } : {}),
            }, { status: 201 });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("V1 Admin Vet POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const body = await req.json();
        const vetId = Number(body.vet_id);
        if (!Number.isInteger(vetId)) return NextResponse.json({ error: "Vet ID required" }, { status: 400 });

        // Only fields the form sent; JSON drops undefined, so an untouched field stays as it is.
        const sets: string[] = [];
        const values: unknown[] = [];
        for (const field of VET_FIELDS) {
            if (body[field] === undefined) continue;
            values.push(vetValue(field, body[field]));
            sets.push(`${field} = $${values.length}`);
        }
        const name = typeof body.name === "string" ? body.name.trim() : "";

        const client = await db.connect();
        try {
            await client.query('BEGIN');
            const vet = await client.query('SELECT user_id FROM vets WHERE vet_id = $1 FOR UPDATE', [vetId]);
            if (!vet.rows[0]) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: "Vet not found" }, { status: 404 });
            }

            if (sets.length > 0) {
                values.push(vetId);
                await client.query(`UPDATE vets SET ${sets.join(", ")} WHERE vet_id = $${values.length}`, values);
            }

            // Name and photo are on the vet's user account (user_id comes from the
            // vets row, not the request). profile_image_url: null removes the photo.
            if (name || body.profile_image_url !== undefined) {
                await client.query(
                    `UPDATE users
                        SET name = COALESCE($1, name),
                            profile_image_url = CASE WHEN $2::boolean THEN $3 ELSE profile_image_url END
                      WHERE user_id = $4`,
                    [name || null, body.profile_image_url !== undefined, body.profile_image_url ?? null, vet.rows[0].user_id]
                );
            }

            const updated = await client.query(
                `SELECT v.*, u.name, u.email, u.profile_image_url, u.phone_number
                   FROM vets v JOIN users u ON v.user_id = u.user_id
                  WHERE v.vet_id = $1`,
                [vetId]
            );
            await client.query('COMMIT');
            return NextResponse.json(updated.rows[0]);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("V1 Admin Vet PATCH error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getUserFromRequest(req);
        if (!user || user.role !== 'admin') return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const vet_id = searchParams.get('vet_id');
        if (!vet_id) return NextResponse.json({ error: "Vet ID required" }, { status: 400 });

        await db.query('DELETE FROM vets WHERE vet_id = $1', [vet_id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
