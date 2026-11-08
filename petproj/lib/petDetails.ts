import { cache } from "react";
import { db } from "@/db/index";
import { stripPetContact } from "@/lib/contacts";

/**
 * One listing with its owner, photos and tags: the body of GET /api/v1/pets/[id].
 *
 * The listing page calls this directly instead of fetching that API over HTTP,
 * which cost a second serverless round trip (twice, metadata and page) before
 * anything rendered. `cache` makes the metadata and the page share one read.
 *
 * Returns null when there is no such listing; database errors throw. The
 * owner's phone and email are left out (lib/contacts.ts): the page is public.
 */
export const getPetDetails = cache(async (id: number): Promise<Record<string, any> | null> => {
    const result = await db.query(`
        SELECT
            pets.*,
            cities.city_name AS city,
            users.name as owner_name,
            users.profile_image_url as owner_image
        FROM pets
        JOIN users ON pets.owner_id = users.user_id
        JOIN cities ON pets.city_id = cities.city_id
        WHERE pets.pet_id = $1
    `, [id]);

    if (result.rowCount === 0) return null;

    const [images, tags] = await Promise.all([
        db.query('SELECT image_id, image_url, "order" FROM pet_images WHERE pet_id = $1 ORDER BY "order" ASC', [id]),
        db.query('SELECT t.tag_id, t.tag_name, t.tag_category FROM pet_tag_assignments pta JOIN pet_tags t ON pta.tag_id = t.tag_id WHERE pta.pet_id = $1', [id]),
    ]);

    return { ...stripPetContact(result.rows[0]), images: images.rows, tags: tags.rows };
});
