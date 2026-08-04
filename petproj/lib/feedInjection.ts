import { db } from "@/db/index";

// Ratio decided for the feed mix: 1 injected (adoption/lost-found) card per
// 12 regular posts, sharing a single slot skewed 2:1 toward adoption listings
// (2 adoption cards for every 1 lost-found card among the injected slots).
const INJECTION_INTERVAL = 12;
const ADOPTION_LOST_FOUND_CYCLE = 3; // seq positions 1,2 -> adoption; 3 -> lost_found
const IMPRESSION_COOLDOWN_DAYS = 7;

type InjectedType = "adoption" | "lost_found";

interface InjectionSlot {
    afterIndex: number;
    type: InjectedType;
}

export interface Coords {
    lat: number;
    lng: number;
}

/**
 * Interleaves adoption-listing and lost/found cards into a page of feed posts.
 * Slot positions are computed from the item's *absolute* position in the
 * viewer's overall feed (offset + index), so the 1-in-12 cadence stays
 * consistent across page boundaries during infinite scroll.
 *
 * "Near you" is based on the device's actual GPS coords (passed in from the
 * client, see app/api/v1/social/posts/route.ts), not the viewer's stored
 * city_id — most accounts don't have one set, and even set cities mostly
 * have few or zero listings. Neither pets nor lost-found posts have their
 * own lat/long, only a city_id, so distance is computed against that city's
 * coordinates (cities.latitude/longitude) — coarser than a precise distance,
 * but enough to rank "same city as you" ahead of "across the country". When
 * coords aren't available (permission denied, older client) candidates just
 * fall back to newest-first, app-wide. Excludes anything shown to this
 * viewer within the last IMPRESSION_COOLDOWN_DAYS days.
 */
export async function interleaveFeedInjections(
    posts: any[],
    viewerUserId: number | null,
    offset: number,
    coords: Coords | null,
): Promise<any[]> {
    const tagged = posts.map((p) => ({ ...p, feed_item_type: "post" }));
    if (!viewerUserId || posts.length === 0) return tagged;

    const slots: InjectionSlot[] = [];
    for (let idx = 0; idx < posts.length; idx++) {
        const absolutePos = offset + idx + 1; // 1-indexed position in the overall feed
        if (absolutePos % INJECTION_INTERVAL === 0) {
            const seqNum = absolutePos / INJECTION_INTERVAL;
            const type: InjectedType =
                (seqNum - 1) % ADOPTION_LOST_FOUND_CYCLE === ADOPTION_LOST_FOUND_CYCLE - 1
                    ? "lost_found"
                    : "adoption";
            slots.push({ afterIndex: idx, type });
        }
    }
    if (slots.length === 0) return tagged;

    const neededAdoption = slots.filter((s) => s.type === "adoption").length;
    const neededLostFound = slots.filter((s) => s.type === "lost_found").length;

    const [adoptionCandidates, lostFoundCandidates] = await Promise.all([
        neededAdoption > 0
            ? fetchAdoptionCandidates(coords, viewerUserId, neededAdoption + 2)
            : Promise.resolve([]),
        neededLostFound > 0
            ? fetchLostFoundCandidates(coords, viewerUserId, neededLostFound + 2)
            : Promise.resolve([]),
    ]);

    let aIdx = 0;
    let lIdx = 0;
    let slotPtr = 0;
    const shown: { type: InjectedType; id: number }[] = [];
    const result: any[] = [];

    for (let idx = 0; idx < tagged.length; idx++) {
        result.push(tagged[idx]);

        if (slotPtr < slots.length && slots[slotPtr].afterIndex === idx) {
            const slot = slots[slotPtr];
            if (slot.type === "adoption" && aIdx < adoptionCandidates.length) {
                const card = adoptionCandidates[aIdx++];
                result.push(card);
                shown.push({ type: "adoption", id: card.id });
            } else if (slot.type === "lost_found" && lIdx < lostFoundCandidates.length) {
                const card = lostFoundCandidates[lIdx++];
                result.push(card);
                shown.push({ type: "lost_found", id: card.id });
            }
            // else: no candidates left for this slot — skip it, don't force an empty card
            slotPtr++;
        }
    }

    if (shown.length > 0) {
        recordImpressions(viewerUserId, shown).catch(() => {});
    }

    return result;
}

// Haversine distance in SQL from the given device coords to each candidate's
// city (cities table, aliased per query) — mirrors app/api/v1/explore/vets-nearby
// for parity. Without coords, order is just newest-first, app-wide.
function distanceExpr(cityAlias: string): string {
    return `
        6371 * acos(LEAST(1.0, GREATEST(-1.0,
            cos(radians($1)) * cos(radians(${cityAlias}.latitude)) * cos(radians(${cityAlias}.longitude) - radians($2))
            + sin(radians($1)) * sin(radians(${cityAlias}.latitude))
        )))
    `;
}

async function fetchAdoptionCandidates(coords: Coords | null, viewerUserId: number, limit: number) {
    const orderBy = coords
        ? `${distanceExpr("cities")} ASC`
        : `pets.created_at DESC`;
    const params = coords
        ? [coords.lat, coords.lng, viewerUserId, limit]
        : [viewerUserId, limit];
    const viewerIdIdx = coords ? 3 : 1;
    const limitIdx = coords ? 4 : 2;

    const result = await db.query(
        `SELECT
            pets.pet_id AS id,
            pets.pet_name,
            pets.pet_breed,
            pets.sex,
            pets.age_months,
            pets.listing_type,
            pets.price,
            pets.city_id,
            cities.city_name AS city,
            (SELECT image_url FROM pet_images WHERE pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) AS image_url
         FROM pets
         JOIN cities ON cities.city_id = pets.city_id
         WHERE pets.adoption_status = 'available'
           AND pets.approved = true
           AND NOT EXISTS (
               SELECT 1 FROM feed_injected_impressions fi
               WHERE fi.user_id = $${viewerIdIdx} AND fi.item_type = 'adoption' AND fi.item_id = pets.pet_id
                 AND fi.shown_at > NOW() - INTERVAL '${IMPRESSION_COOLDOWN_DAYS} days'
           )
         ORDER BY ${orderBy}
         LIMIT $${limitIdx}`,
        params
    );
    return result.rows.map((row) => ({ ...row, feed_item_type: "adoption_listing" }));
}

async function fetchLostFoundCandidates(coords: Coords | null, viewerUserId: number, limit: number) {
    const orderBy = coords
        ? `${distanceExpr("c")} ASC`
        : `p.post_date DESC, p.post_id DESC`;
    const params = coords
        ? [coords.lat, coords.lng, viewerUserId, limit]
        : [viewerUserId, limit];
    const viewerIdIdx = coords ? 3 : 1;
    const limitIdx = coords ? 4 : 2;

    const result = await db.query(
        `SELECT
            p.post_id AS id,
            p.post_type,
            p.pet_description,
            p.location,
            p.contact_info,
            p.date,
            p.city_id,
            c.city_name AS city,
            (
                SELECT i.image_url FROM lost_and_found_post_images i
                WHERE i.post_id = p.post_id
                ORDER BY i.image_id ASC
                LIMIT 1
            ) AS image_url
         FROM lost_and_found_posts p
         JOIN cities c ON c.city_id = p.city_id
         WHERE COALESCE(p.status, 'active') = 'active'
           AND NOT EXISTS (
               SELECT 1 FROM feed_injected_impressions fi
               WHERE fi.user_id = $${viewerIdIdx} AND fi.item_type = 'lost_found' AND fi.item_id = p.post_id
                 AND fi.shown_at > NOW() - INTERVAL '${IMPRESSION_COOLDOWN_DAYS} days'
           )
         ORDER BY ${orderBy}
         LIMIT $${limitIdx}`,
        params
    );
    return result.rows.map((row) => ({ ...row, feed_item_type: "lost_found" }));
}

async function recordImpressions(userId: number, items: { type: InjectedType; id: number }[]) {
    for (const item of items) {
        await db.query(
            `INSERT INTO feed_injected_impressions (user_id, item_type, item_id, shown_at)
             VALUES ($1, $2, $3, NOW())
             ON CONFLICT (user_id, item_type, item_id) DO UPDATE SET shown_at = NOW()`,
            [userId, item.type, item.id]
        );
    }
}
