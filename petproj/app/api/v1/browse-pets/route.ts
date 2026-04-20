import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";

/**
 * @swagger
 * /api/v1/browse-pets:
 *   get:
 *     summary: Search and browse pets (V1)
 *     tags: [v1 Pets]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        
        // Pagination
        const page = parseInt(searchParams.get("page") || "1", 10);
        const limit = parseInt(searchParams.get("limit") || "10", 10);
        const offset = (page - 1) * limit;

        // Filters
        const cityId = searchParams.get("city");
        const speciesId = searchParams.get("species");
        const breed = searchParams.get("breed");
        const sex = searchParams.get("sex");
        const minAge = searchParams.get("minAge");
        const maxAge = searchParams.get("maxAge");

        const conditions: string[] = ["pets.adoption_status = 'available'", "pets.approved = true"];
        const values: any[] = [];
        let pIndex = 1;

        if (cityId) { conditions.push(`pets.city_id = $${pIndex++}`); values.push(parseInt(cityId)); }
        if (speciesId) { conditions.push(`pets.pet_type = $${pIndex++}`); values.push(parseInt(speciesId)); }
        if (breed) { conditions.push(`LOWER(pets.pet_breed) LIKE $${pIndex++}`); values.push(`%${breed.toLowerCase()}%`); }
        if (sex) { conditions.push(`pets.sex = $${pIndex++}`); values.push(sex); }
        if (minAge) { conditions.push(`pets.age_months >= $${pIndex++}`); values.push(Math.round(parseFloat(minAge) * 12)); }
        if (maxAge) { conditions.push(`pets.age_months <= $${pIndex++}`); values.push(Math.round(parseFloat(maxAge) * 12)); }

        const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Total Count
        const countRes = await db.query(`SELECT COUNT(*) FROM pets ${where}`, values);
        const total = parseInt(countRes.rows[0].count, 10);

        // Data with optimized JSON media subquery
        const dataQuery = `
            SELECT 
                pets.*,
                cities.city_name AS city,
                users.profile_image_url as owner_image,
                (SELECT image_url FROM pet_images WHERE pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) as image_url
            FROM pets
            JOIN users ON pets.owner_id = users.user_id
            JOIN cities ON pets.city_id = cities.city_id
            ${where}
            ORDER BY pets.created_at DESC
            LIMIT $${pIndex++} OFFSET $${pIndex++}
        `;

        const result = await db.query(dataQuery, [...values, limit, offset]);

        return NextResponse.json({
            data: result.rows,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error("V1 Browse Pets Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
