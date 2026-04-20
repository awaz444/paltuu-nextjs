import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";

/**
 * @swagger
 * /api/v1/qurbani:
 *   get:
 *     summary: Get qurbani animals marketplace (V1)
 *     tags: [v1 Qurbani]
 *   post:
 *     summary: List a qurbani animal for sale (V1)
 *     tags: [v1 Qurbani]
 */

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const city = searchParams.get("city");
        const species = searchParams.get("species");

        const conditions = ["a.status = 'Available'"];
        const values = [];
        let pIdx = 1;

        if (city) { values.push(city); conditions.push(`a.city ILIKE $${pIdx++}`); }
        if (species) { values.push(species); conditions.push(`a.species = $${pIdx++}`); }

        const query = `
            SELECT 
                a.*,
                u.name AS seller_name,
                u.phone_number AS seller_contact,
                COALESCE(
                    (SELECT json_agg(p.photo_url) FROM qurbani_animals_photo p WHERE p.animal_id = a.id),
                    '[]'::json
                ) AS images
            FROM qurbani_animals a
            JOIN users u ON a.seller_id = u.user_id   
            WHERE ${conditions.join(" AND ")}
            ORDER BY a.created_at DESC
        `;

        const result = await db.query(query, values);
        return NextResponse.json(result.rows);

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const validation = validate(body, {
            species: { required: true },
            breed: { required: true },
            price: { required: true },
            location: { required: true },
            city: { required: true }
        });

        if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

        const {
            species, breed, age, weight, height, teeth_count, horn_condition, 
            is_vaccinated, description, price, location, city
        } = body;

        const result = await db.query(`
            INSERT INTO qurbani_animals (
                seller_id, species, breed, age, weight, height, 
                teeth_count, horn_condition, is_vaccinated, 
                description, price, location, city, status, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'Available', CURRENT_TIMESTAMP)
            RETURNING *
        `, [userId, species, breed, age, weight, height, teeth_count, horn_condition, is_vaccinated, description, price, location, city]);

        return NextResponse.json(result.rows[0], { status: 201 });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
