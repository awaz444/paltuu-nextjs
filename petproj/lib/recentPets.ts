import { db } from "@/db/index";

/**
 * Server-side fetch for the homepage's "recently listed" strip.
 *
 * This mirrors the SELECT in app/api/v1/browse-pets/route.ts, but runs during
 * render instead of from the browser. The section used to client-fetch and
 * return null while loading, which meant crawlers saw an empty band and users
 * got a layout shift — rendering it on the server puts real pet names, cities
 * and links to /browse-pets/[id] into the HTML.
 */

export interface RecentPet {
    pet_id: number;
    pet_name: string;
    pet_breed: string | null;
    age_months: number;
    city: string;
    listing_type: string;
    image_url: string | null;
}

export async function getRecentPets(limit = 3): Promise<RecentPet[]> {
    try {
        const result = await db.query(
            `SELECT
                pets.pet_id,
                pets.pet_name,
                pets.pet_breed,
                pets.age_months,
                pets.listing_type,
                cities.city_name AS city,
                (SELECT image_url FROM pet_images
                  WHERE pet_id = pets.pet_id
                  ORDER BY "order" ASC LIMIT 1) AS image_url
             FROM pets
             JOIN cities ON pets.city_id = cities.city_id
             WHERE pets.adoption_status = 'available' AND pets.approved = true
             ORDER BY pets.created_at DESC
             LIMIT $1`,
            [limit]
        );

        return result.rows as RecentPet[];
    } catch (error) {
        // The homepage is statically generated, so this runs at build time too.
        // A DB blip should degrade the section to nothing, never fail the build.
        console.error("getRecentPets failed:", error);
        return [];
    }
}
