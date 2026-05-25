import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { sendNewListingNotification } from "@/utils/mailjet";

/**
 * @swagger
 * /api/v1/pets:
 *   get:
 *     summary: Fetch pet listings (Browse)
 *     description: Returns a paginated list of approved pet listings with filtering support.
 *     tags: [v1 Pets]
 *   post:
 *     summary: Create a new pet listing
 *     description: Create a new pet listing for the authenticated user.
 *     tags: [v1 Pets]
 */

// GET: Optimized Feed / Browse
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
        const sex = searchParams.get("sex");
        const listingType = searchParams.get("type"); // rescue, adoption, sale
        const minPrice = searchParams.get("minPrice");
        const maxPrice = searchParams.get("maxPrice");

        const conditions: string[] = ["pets.adoption_status = 'available'", "pets.approved = true"];
        const values: any[] = [];
        let paramIndex = 1;

        if (cityId) { conditions.push(`pets.city_id = $${paramIndex++}`); values.push(parseInt(cityId)); }
        if (speciesId) { conditions.push(`pets.pet_type = $${paramIndex++}`); values.push(parseInt(speciesId)); }
        if (sex) { conditions.push(`pets.sex = $${paramIndex++}`); values.push(sex); }
        if (listingType) { conditions.push(`pets.listing_type = $${paramIndex++}`); values.push(listingType); }
        if (minPrice) { conditions.push(`pets.price >= $${paramIndex++}`); values.push(parseFloat(minPrice)); }
        if (maxPrice) { conditions.push(`pets.price <= $${paramIndex++}`); values.push(parseFloat(maxPrice)); }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

        // Get total count
        const countResult = await db.query(`SELECT COUNT(*) FROM pets ${whereClause}`, values);
        const total = parseInt(countResult.rows[0].count, 10);

        // Get Data
        const dataQuery = `
            SELECT 
                pets.*,                      
                cities.city_name AS city,     
                users.name as owner_name,
                users.profile_image_url as owner_image,     
                (SELECT image_url FROM pet_images WHERE pet_images.pet_id = pets.pet_id ORDER BY "order" ASC LIMIT 1) as main_image
            FROM pets
            JOIN users ON pets.owner_id = users.user_id
            JOIN cities ON pets.city_id = cities.city_id
            ${whereClause}
            ORDER BY pets.created_at DESC
            LIMIT $${paramIndex++} OFFSET $${paramIndex++}
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
        console.error("V1 Pets GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// POST: Secure Creation
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        
        // Validation
        const validation = validate(body, {
            pet_name: { required: true, min: 2 },
            pet_type: { required: true },
            city_id: { required: true },
            listing_type: { required: true }
        });

        if (!validation.success) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        const {
            pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
            description, sex, listing_type, vaccinated, neutered, price, rescue_story,
            energy_level, cuddliness_level
        } = body;

        // Auto-assign owner_id (Security fix)
        const result = await db.query(
            `INSERT INTO pets (
                owner_id, pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
                description, adoption_status, sex, listing_type, vaccinated, neutered, price, 
                rescue_story, created_at, energy_level, cuddliness_level, approved
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'available', $10, $11, $12, $13, $14, $15, CURRENT_TIMESTAMP, $16, $17, false)
            RETURNING *`,
            [
                userId, pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
                description, sex, listing_type, vaccinated || false, neutered || false, 
                listing_type === 'rescue' ? null : price, rescue_story, energy_level, cuddliness_level
            ]
        );

        const newPet = result.rows[0];

        // Fire-and-forget: notify admin of new listing awaiting approval.
        // Fetch owner info first, then send — all in background, never blocks the response.
        Promise.resolve().then(async () => {
            try {
                const ownerRes = await db.query(
                    'SELECT name, email FROM users WHERE user_id = $1',
                    [userId]
                );
                await sendNewListingNotification({
                    pet_id: newPet.pet_id,
                    pet_name: newPet.pet_name,
                    pet_type: String(newPet.pet_type),
                    listing_type: newPet.listing_type,
                    owner_name: ownerRes.rows[0]?.name,
                    owner_email: ownerRes.rows[0]?.email,
                });
            } catch (err) {
                console.error('❌ [pets/POST] listing notification email failed:', err);
            }
        });

        return NextResponse.json(newPet, { status: 201 });

    } catch (error) {
        console.error("V1 Pets POST error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

// OPTIONS: CORS
export async function OPTIONS() {
    return new Response(null, { status: 200 });
}
