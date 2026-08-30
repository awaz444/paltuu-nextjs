import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest, getUserFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { withRetry } from "@/utils/retry";
import { hasSevereIdentityMatch } from "@/lib/moderation/badWords";

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
        const pageStr = searchParams.get("page") || "1";
        const limitStr = searchParams.get("limit") || "10";
        const page = parseInt(pageStr, 10);
        const limit = parseInt(limitStr, 10);
        if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1) {
            return NextResponse.json({ error: "Invalid pagination parameters" }, { status: 400 });
        }
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

        if (cityId) {
            const parsedCityId = parseInt(cityId, 10);
            if (isNaN(parsedCityId)) {
                return NextResponse.json({ error: "Invalid city parameter" }, { status: 400 });
            }
            conditions.push(`pets.city_id = $${paramIndex++}`);
            values.push(parsedCityId);
        }
        if (speciesId) {
            const parsedSpeciesId = parseInt(speciesId, 10);
            if (isNaN(parsedSpeciesId)) {
                return NextResponse.json({ error: "Invalid species parameter" }, { status: 400 });
            }
            conditions.push(`pets.pet_type = $${paramIndex++}`);
            values.push(parsedSpeciesId);
        }
        if (sex) {
            conditions.push(`pets.sex = $${paramIndex++}`);
            values.push(sex);
        }
        if (listingType) {
            conditions.push(`pets.listing_type = $${paramIndex++}`);
            values.push(listingType);
        }
        if (minPrice) {
            const parsedMinPrice = parseFloat(minPrice);
            if (isNaN(parsedMinPrice)) {
                return NextResponse.json({ error: "Invalid minPrice parameter" }, { status: 400 });
            }
            conditions.push(`pets.price >= $${paramIndex++}`);
            values.push(parsedMinPrice);
        }
        if (maxPrice) {
            const parsedMaxPrice = parseFloat(maxPrice);
            if (isNaN(parsedMaxPrice)) {
                return NextResponse.json({ error: "Invalid maxPrice parameter" }, { status: 400 });
            }
            conditions.push(`pets.price <= $${paramIndex++}`);
            values.push(parsedMaxPrice);
        }

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
        
        // Validation. The `max` limits mirror the underlying column widths so an
        // oversized field returns a 400 instead of blowing up as a Postgres
        // "value too long for type character varying" (22001) error.
        const validation = validate(body, {
            pet_name: { required: true, min: 2, max: 255 },
            pet_type: { required: true },
            city_id: { required: true },
            listing_type: { required: true, max: 255 },
            pet_breed: { max: 255 },
            area: { max: 255 },
            sex: { max: 255 },
            description: { max: 1000 },
            contact_number: { max: 255 }
        });

        if (!validation.success) {
            return NextResponse.json({ errors: validation.errors }, { status: 400 });
        }

        const {
            pet_name, pet_type, pet_breed, city_id, area, age_months, contact_number,
            description, sex, listing_type, vaccinated, neutered, price, rescue_story,
            energy_level, cuddliness_level, tags
        } = body;

        if (hasSevereIdentityMatch(pet_name) || (description && hasSevereIdentityMatch(description))) {
            return NextResponse.json({ errors: ["Listing contains language that isn't allowed"] }, { status: 400 });
        }

        // Auto-assign owner_id (Security fix)
        const result = await withRetry(
            () => db.query(
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
            ),
            { label: "insert pet listing" }
        );

        const newPet = result.rows[0];

        if (Array.isArray(tags) && tags.length > 0) {
            const values = tags.map((_: any, i: number) => `($1, $${i + 2})`).join(', ');
            await db.query(
                `INSERT INTO pet_tag_assignments (pet_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`,
                [newPet.pet_id, ...tags]
            );
        }

        // The "new listing" admin notification is intentionally NOT sent here —
        // at this point the listing has no photos yet (those are uploaded in a
        // separate request right after this one from create-listing/page.tsx).
        // It's sent from app/api/v1/upload-image/route.ts once that upload
        // completes, so the email can include the actual photos.

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
