import { db } from "@/db/index";
import { EXPRESS_VET_CATEGORY_SPECIES } from "./catalog";

const VALID_CATEGORIES = Object.keys(EXPRESS_VET_CATEGORY_SPECIES);

export interface NewProviderInput {
  name: string;
  photo_url?: string | null;
  years_experience?: number | null;
  qualifications?: string | null;
  categories: string[];
  phone_number?: string | null;
}

export class InvalidProviderError extends Error {}

/**
 * Shared by POST /dispatcher/providers and the assign route's inline "create new provider"
 * path — one place for the validation + insert so the two never drift apart.
 */
export async function createProvider(dispatcherId: number, input: NewProviderInput) {
  if (!input.name || !input.name.trim()) {
    throw new InvalidProviderError("name is required");
  }
  const categories = Array.isArray(input.categories) ? input.categories : [];
  if (categories.length === 0 || !categories.every((c) => VALID_CATEGORIES.includes(c))) {
    throw new InvalidProviderError(`categories must be a non-empty array of: ${VALID_CATEGORIES.join(", ")}`);
  }

  const result = await db.query(
    `INSERT INTO express_vet_providers (
       name, photo_url, years_experience, qualifications, categories, phone_number, created_by_dispatcher_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.name.trim(),
      input.photo_url ?? null,
      input.years_experience ?? null,
      input.qualifications ?? null,
      categories,
      input.phone_number ?? null,
      dispatcherId,
    ]
  );

  return result.rows[0];
}

/**
 * Get-or-create the dispatcher's own provider row without needing a category.
 *
 * Backs the "My vet profile" entry on the dispatcher dashboard: a dispatcher is also a vet
 * and should be able to set up their profile (photo, qualifications, experience) *before*
 * ever self-assigning a job. The row starts with empty categories — harmless, since the
 * roster filters on is_active not categories, and the edit screen requires at least one
 * category before it will save. A later self-assign reuses this same row via linked_user_id
 * and appends whatever category it needs (see findOrCreateSelfProvider).
 */
export async function ensureSelfProvider(dispatcherId: number, dispatcherName: string) {
  const existing = await db.query(`SELECT * FROM express_vet_providers WHERE linked_user_id = $1`, [dispatcherId]);
  if (existing.rows[0]) return existing.rows[0];

  const result = await db.query(
    `INSERT INTO express_vet_providers (
       name, categories, created_by_dispatcher_id, linked_user_id
     ) VALUES ($1, '{}', $2, $2)
     RETURNING *`,
    [dispatcherName, dispatcherId]
  );
  return result.rows[0];
}

/**
 * Find-or-create the provider row for a dispatcher assigning himself ("Assign to Myself").
 * Reused across requests via linked_user_id, so a given dispatcher only ever has one such row.
 */
export async function findOrCreateSelfProvider(dispatcherId: number, dispatcherName: string, category: string) {
  const existing = await db.query(`SELECT * FROM express_vet_providers WHERE linked_user_id = $1`, [dispatcherId]);
  if (existing.rows[0]) {
    // Make sure the category being assigned is on the provider's list — self-assign can
    // happen for any category the dispatcher is willing to personally take.
    const provider = existing.rows[0];
    if (!provider.categories.includes(category)) {
      const updated = await db.query(
        `UPDATE express_vet_providers SET categories = array_append(categories, $1), updated_at = now()
         WHERE provider_id = $2 RETURNING *`,
        [category, provider.provider_id]
      );
      return updated.rows[0];
    }
    return provider;
  }

  const result = await db.query(
    `INSERT INTO express_vet_providers (
       name, categories, created_by_dispatcher_id, linked_user_id
     ) VALUES ($1, $2, $3, $3)
     RETURNING *`,
    [dispatcherName, [category], dispatcherId]
  );
  return result.rows[0];
}
