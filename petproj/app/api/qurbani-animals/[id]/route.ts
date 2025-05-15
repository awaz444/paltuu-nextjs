// app/api/qurbani-animals/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../db/index";

export interface UpdateQurbaniAnimalDto {
    species?: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
    breed?: string;
    age?: number;
    weight?: number;
    height?: number;
    teethCount?: number;
    hornCondition?: "Good" | "Damaged" | "Broken" | "None";
    isVaccinated?: boolean;
    description?: string;
    price?: number | null;
    location?: string;
    city?: string;
    status?: "Available" | "Sold" | "Reserved";
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const animalId = params.id;

    try {
        const body: UpdateQurbaniAnimalDto = await req.json();

        // Remove sellerId if it's being sent in the body (shouldn't be updatable)
        if ("sellerId" in body) {
            delete body.sellerId;
        }

        await client.connect();

        const allowedKeys = [
            "species",
            "breed",
            "age",
            "weight",
            "height",
            "teethCount",
            "hornCondition",
            "isVaccinated",
            "description",
            "price",
            "location",
            "city",
            "status",
        ];

        // Build the dynamic query based on provided fields
        const fieldsToUpdate = [];
        const values = [];
        let paramIndex = 1;

        for (const [key, value] of Object.entries(body)) {
            if (value !== undefined && allowedKeys.includes(key)) {
                let dbColumnName = key;

                // Convert camelCase to snake_case for database columns
                if (key === "teethCount") dbColumnName = "teeth_count";
                if (key === "hornCondition") dbColumnName = "horn_condition";
                if (key === "isVaccinated") dbColumnName = "is_vaccinated";

                fieldsToUpdate.push(`${dbColumnName} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        // Add each provided field to the update query
        for (const [key, value] of Object.entries(body)) {
            if (value !== undefined) {
                let dbColumnName = key;

                // Convert camelCase to snake_case for database columns
                if (key === "teethCount") dbColumnName = "teeth_count";
                if (key === "hornCondition") dbColumnName = "horn_condition";
                if (key === "isVaccinated") dbColumnName = "is_vaccinated";

                fieldsToUpdate.push(`${dbColumnName} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        // If no valid fields to update, return bad request
        if (fieldsToUpdate.length === 0) {
            return NextResponse.json(
                { error: "No valid fields provided for update" },
                { status: 400 }
            );
        }

        // Add updated_at timestamp
        fieldsToUpdate.push(`updated_at = NOW()`);

        const query = `
      UPDATE qurbani_animals
      SET ${fieldsToUpdate.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *;
    `;

        values.push(animalId);

        const result = await client.query(query, values);

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Animal not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(result.rows[0], { status: 200 });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (err as Error).message || "An unknown error occurred",
            },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const client = createClient();
    const animalId = params.id;

    try {
        await client.connect();

        // First delete associated photos to maintain referential integrity
        await client.query(
            `DELETE FROM qurbani_animals_photo WHERE animal_id = $1`,
            [animalId]
        );

        // Then delete the animal
        const result = await client.query(
            `DELETE FROM qurbani_animals WHERE id = $1 RETURNING *`,
            [animalId]
        );

        if (result.rowCount === 0) {
            return NextResponse.json(
                { error: "Animal not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: "Animal deleted successfully",
                deletedAnimal: result.rows[0],
            },
            { status: 200 }
        );
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                message: (err as Error).message || "An unknown error occurred",
            },
            { status: 500 }
        );
    } finally {
        await client.end();
    }
}
