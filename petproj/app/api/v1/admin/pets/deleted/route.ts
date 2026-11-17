import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { hasListingArchive } from "@/lib/listingArchive";

/**
 * @swagger
 * /api/v1/admin/pets/deleted:
 *   get:
 *     summary: Search deleted pet listings (Admin V1)
 *     description: >
 *       Listings kept in deleted_pets when they were deleted (PALTU-166), newest
 *       first. `q` matches the pet id, pet name, owner name or email, or the
 *       listing's contact number. Admins only.
 *     tags: [v1 Admin]
 */
export async function GET(req: NextRequest) {
    try {
        if (!(await checkAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

        if (!(await hasListingArchive())) {
            return NextResponse.json({
                archiveEnabled: false,
                message: "Deleted listings aren't kept yet: run migrations/add_deleted_pets_archive.sql.",
                listings: [],
            });
        }

        const { searchParams } = new URL(req.url);
        const q = (searchParams.get("q") ?? "").trim();
        const limit = Math.min(Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1), 200);
        // Numbers are stored as +92..., people type 0300...: match without leading zeros.
        const digits = q.replace(/\D/g, "").replace(/^0+/, "");

        const { rows } = await db.query(
            `SELECT pet_id, pet_name, adoption_status, contact_number,
                    owner_id, owner_name, owner_email,
                    deleted_by, deleted_via, deleted_at,
                    listing->>'created_at' AS listed_at,
                    listing->>'pet_type' AS pet_type,
                    images, tags, applications
               FROM deleted_pets
              WHERE $1 = ''
                 OR pet_id::text = $1
                 OR pet_name ILIKE '%' || $1 || '%'
                 OR owner_name ILIKE '%' || $1 || '%'
                 OR owner_email ILIKE '%' || $1 || '%'
                 OR ($2 <> '' AND regexp_replace(coalesce(contact_number, ''), '\\D', '', 'g') LIKE '%' || $2 || '%')
              ORDER BY deleted_at DESC
              LIMIT $3`,
            [q.replace(/^pet#/i, ""), digits.length >= 4 ? digits : "", limit]
        );

        return NextResponse.json({ archiveEnabled: true, listings: rows });
    } catch (error) {
        console.error("V1 Admin Deleted Pets GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
