import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "../../../db/index";

export interface CreateQurbaniAnimalDto {
  seller_id: number;
  species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
  breed: string;
  age: number;
  weight: number;
  height: number;
  teethCount?: number;
  hornCondition?: 'Good' | 'Damaged' | 'Broken' | 'None';
  isVaccinated: boolean;
  description?: string;
  price: number | null;
  location: string;
  city: string;
  status?: 'Available';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        const body: CreateQurbaniAnimalDto = await req.json();
        const {
            seller_id,
            species,
            breed,
            age,
            weight,
            height,
            teethCount,
            hornCondition,
            isVaccinated,
            description,
            price,
            location,
            city,
            status = 'Available' // Default to 'Available' if not provided
        } = body;

        // Validate required fields
        if (
            !seller_id ||
            !species ||
            !breed ||
            age === undefined ||
            weight === undefined ||
            height === undefined ||
            isVaccinated === undefined ||
            !location ||
            !city
        ) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        await client.connect();

        const query = `
        INSERT INTO qurbani_animals (
            seller_id, species, breed, age, weight, height, 
            teeth_count, horn_condition, is_vaccinated, 
            description, price, location, city, status, created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW())
        RETURNING *;
        `;

        const values = [
            seller_id,
            species,
            breed,
            age,
            weight,
            height,
            teethCount || null,
            hornCondition || null,
            isVaccinated,
            description || null,
            price || null,
            location,
            city,
            status // Added status to values
        ];

        const result = await client.query(query, values);

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (err as Error).message || "An unknown error occurred"
            },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}

export interface QurbaniAnimalWithDetails {
  id: string;
  species: string;
  breed: string;
  age: number;
  weight: number;
  height: number;
  teethCount: number;
  hornCondition?: string;
  isVaccinated: boolean;
  price: number | null;
  status: string;
  location: string;
  city: string;
  sellerId: string;
  sellerName: string;
  sellerContact: string;
  images: string[];
}

export async function GET() {
  const client = createClient();

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
        a.price,
        a.status,
        a.location,
        a.city,
        a.seller_id AS "sellerId",
        u.name AS "sellerName",
        u.phone_number AS "sellerContact",
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
        a.status = 'Available'
      ORDER BY
        a.created_at DESC
    `;

    const result = await client.query(query);
    console.log(result);
    return NextResponse.json(result.rows, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch animals", details: (error as Error).message },
      { status: 500 }
    );
  } finally {
    await client.end();
  }
}