import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/admin/reviews?state=pending|approved
 *
 * Vet and clinic reviews (both live in vet_reviews: vet_id for a vet, clinic_id
 * for a clinic) for admins to approve before they show publicly. New reviews
 * are inserted with is_approved = false and every public read filters on
 * is_approved = true (PALTU-66 for vets, PALTU-117 for clinics). Admins are the
 * only moderators: the vet panel, where vets approved their own, is gone
 * (PALTU-121).
 */
export async function GET(req: NextRequest) {
    if (!(await checkAdmin(req))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const state = req.nextUrl.searchParams.get("state") === "approved" ? "approved" : "pending";

    try {
        const [reviews, counts] = await Promise.all([
            db.query(
                `SELECT vr.review_id, vr.rating, vr.review_content, vr.review_date,
                        vr.vet_id, vu.name AS vet_name,
                        vr.clinic_id, c.name AS clinic_name,
                        vr.user_id, u.name AS reviewer_name
                   FROM vet_reviews vr
                   LEFT JOIN users u ON u.user_id = vr.user_id
                   LEFT JOIN vets v ON v.vet_id = vr.vet_id
                   LEFT JOIN users vu ON vu.user_id = v.user_id
                   LEFT JOIN clinics c ON c.clinic_id = vr.clinic_id
                  WHERE ${state === "approved" ? "vr.is_approved = true" : "vr.is_approved IS NOT TRUE"}
                  ORDER BY vr.review_date DESC NULLS LAST, vr.review_id DESC
                  LIMIT 200`
            ),
            db.query(
                `SELECT COUNT(*) FILTER (WHERE is_approved IS NOT TRUE)::int AS pending,
                        COUNT(*) FILTER (WHERE is_approved = true)::int AS approved
                   FROM vet_reviews`
            ),
        ]);

        return NextResponse.json({ reviews: reviews.rows, counts: counts.rows[0] });
    } catch (error) {
        console.error("V1 Admin reviews GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
