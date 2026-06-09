import { db } from "@/db/index";
import BrowsePetsClient from "./BrowsePetsClient";

// Fetch first page of available pets at request time so Googlebot gets real content in HTML.
async function getInitialPets() {
    try {
        const baseWhere = "WHERE pets.adoption_status = 'available' AND pets.approved = true";

        const countRes = await db.query(`SELECT COUNT(*) FROM pets ${baseWhere}`);
        const total = parseInt(countRes.rows[0].count, 10);

        const result = await db.query(`
            SELECT
                pets.*,
                cities.city_name AS city,
                users.profile_image_url as owner_image,
                (SELECT image_url FROM pet_images WHERE pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) as image_url
            FROM pets
            JOIN users ON pets.owner_id = users.user_id
            JOIN cities ON pets.city_id = cities.city_id
            ${baseWhere}
            ORDER BY pets.created_at DESC
            LIMIT 11 OFFSET 0
        `);

        return {
            pets: result.rows,
            meta: { total, page: 1, limit: 11, totalPages: Math.ceil(total / 11) },
        };
    } catch {
        return { pets: [], meta: { total: 0, page: 1, limit: 11, totalPages: 0 } };
    }
}

export default async function BrowsePetsPage() {
    const { pets: initialPets, meta: initialMeta } = await getInitialPets();
    return <BrowsePetsClient initialPets={initialPets} initialMeta={initialMeta} />;
}
