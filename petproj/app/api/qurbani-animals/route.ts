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