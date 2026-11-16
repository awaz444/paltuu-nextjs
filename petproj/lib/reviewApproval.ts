import { db } from "@/db/index";

/**
 * Whether vet_reviews has its is_approved column yet (PALTU-163).
 *
 * PALTU-66 and PALTU-117 made public vet and clinic review reads filter on
 * vet_reviews.is_approved, but migrations/add_is_approved_to_vet_reviews.sql
 * hadn't been run on production, so every clinic page and vet profile 404'd
 * and the review APIs returned 500. Until that migration runs, these helpers
 * fall back to how reviews worked before PALTU-66: every review is public and
 * there is nothing to approve. Once it runs, approval switches on by itself
 * within a minute, with no deploy.
 *
 * A "yes" is cached for the life of the server; a "no" is checked again after
 * a minute so the switch-over is picked up.
 */
const RECHECK_MS = 60_000;
let known: { value: boolean; at: number } | null = null;

export async function hasReviewApproval(): Promise<boolean> {
    if (known && (known.value || Date.now() - known.at < RECHECK_MS)) return known.value;
    try {
        const { rowCount } = await db.query(
            `SELECT 1 FROM information_schema.columns
              WHERE table_schema = current_schema() AND table_name = 'vet_reviews' AND column_name = 'is_approved'`
        );
        known = { value: (rowCount ?? 0) > 0, at: Date.now() };
    } catch (err) {
        console.error("[reviewApproval] column check failed:", err);
        // Don't cache a failed check; assume the column is missing so reads still work.
        return false;
    }
    return known.value;
}

/**
 * SQL to append to a public review read's WHERE clause: " AND vr.is_approved = true",
 * or nothing while the column doesn't exist. Pass the table alias, or "" for none.
 */
export async function approvedReviewsOnly(alias = "vr"): Promise<string> {
    const column = alias ? `${alias}.is_approved` : "is_approved";
    return (await hasReviewApproval()) ? ` AND ${column} = true` : "";
}
