import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "../../../../../db/index";

export async function GET(
  req: NextRequest,
  { params }: { params: { user_id: string } }
): Promise<NextResponse> {
  const client = createClient();
  const userId = params.user_id;

  try {
    await client.connect();

    const query = `
      SELECT 
        a.id,
        a.species,
        a.breed,
        a.age,
        a.weight,
        a.height,
        a.teeth_count AS "teethCount",
        a.horn_condition AS "hornCondition",
        a.is_vaccinated AS "isVaccinated",
        a.description,
        a.price,
        a.status,
        a.location,
        a.city,
        a.seller_id AS "sellerId",
        u.name AS "sellerName",
        u.phone_number AS "sellerContact",
        u.profile_image_url AS "sellerProfileImage",
        COALESCE(
          (SELECT ARRAY_AGG(p.photo_url)
           FROM qurbani_animals_photo p
           WHERE p.animal_id = a.id),
          ARRAY[]::TEXT[]
        ) AS images
      FROM 
        qurbani_animals a
      JOIN 
        users u ON a.seller_id = u.user_id
      WHERE 
        a.seller_id = $1
      ORDER BY
        a.created_at DESC
    `;

    const result = await client.query(query, [userId]);

    // Transform the data to match the expected format
    const transformedAnimals = result.rows.map(animal => ({
      ...animal,
      weight: parseFloat(animal.weight),
      height: parseFloat(animal.height),
      price: animal.price ? parseFloat(animal.price) : null,
      sellerId: animal.sellerId.toString() // Ensure sellerId is string if it's number in DB
    }));

    return NextResponse.json(transformedAnimals, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { 
        error: "Failed to fetch animals by user", 
        details: (error as Error).message 
      },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}