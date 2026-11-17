import { db } from "@/db/index";

/**
 * Copies of deleted pet listings (PALTU-166).
 *
 * migrations/add_deleted_pets_archive.sql adds the deleted_pets table and the
 * archive_pet() function. Until it has run on a database, archiving is skipped
 * and deletes behave exactly as before, so a late migration never breaks the
 * delete buttons. Once it has run, the answer is remembered; a missing
 * migration is checked again every minute.
 */

const RECHECK_MS = 60_000;
let known: { value: boolean; at: number } | null = null;

export async function hasListingArchive(): Promise<boolean> {
    if (known && (known.value || Date.now() - known.at < RECHECK_MS)) return known.value;
    try {
        const { rows } = await db.query(
            `SELECT to_regclass('deleted_pets') IS NOT NULL
                AND to_regprocedure('archive_pet(integer,integer,text)') IS NOT NULL AS ready`
        );
        known = { value: rows[0]?.ready === true, at: Date.now() };
    } catch (err) {
        console.error("[listingArchive] setup check failed:", err);
        return false;
    }
    return known.value;
}

type Queryable = { query: (text: string, params?: unknown[]) => Promise<unknown> };

/**
 * Copies a listing, its photos, tags and adoption applications into
 * deleted_pets. Call it inside the delete transaction, before anything is
 * removed. If the copy fails the error is thrown, so the delete rolls back
 * rather than losing the listing.
 *
 * @param via Where the delete came from, e.g. "owner" or "admin".
 * @returns false when the archive isn't set up on this database yet.
 */
export async function archiveListing(
    client: Queryable,
    petId: number,
    deletedBy: number | null,
    via: string,
): Promise<boolean> {
    if (!(await hasListingArchive())) {
        console.warn(`[listingArchive] deleted_pets is missing; listing ${petId} is deleted without a copy. Run migrations/add_deleted_pets_archive.sql.`);
        return false;
    }
    await client.query("SELECT archive_pet($1, $2, $3)", [petId, Number.isFinite(deletedBy) ? deletedBy : null, via]);
    return true;
}
