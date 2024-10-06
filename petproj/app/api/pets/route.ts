import { createClient } from '../../../db/index'; 
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
    const {
        owner_id,
        pet_name,
        pet_type,
        pet_breed,
        city_id,
        area,
        age,
        description,
        adoption_status,
        min_age_of_children,
        can_live_with_dogs,
        can_live_with_cats,
        must_have_someone_home,
        energy_level,
        cuddliness_level,
        health_issues
    } = await req.json();
    
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(
            'INSERT INTO pets (owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level, health_issues) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *',
            [
                owner_id,
                pet_name,
                pet_type,
                pet_breed,
                city_id,
                area,
                age,
                description,
                adoption_status,
                min_age_of_children,
                can_live_with_dogs,
                can_live_with_cats,
                must_have_someone_home,
                energy_level,
                cuddliness_level,
                health_issues
            ]
        );

        return NextResponse.json(result.rows[0], {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end(); // Always close the connection
    }
}

// GET method to fetch all pets
export async function GET(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('SELECT * FROM pets'); 
        return NextResponse.json(result.rows, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end(); 
    }
}

// PUT method to update a pet by ID
export async function PUT(req: NextRequest): Promise<NextResponse> {
    const { pet_id, owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level, health_issues } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(
            'UPDATE pets SET owner_id = $1, pet_name = $2, pet_type = $3, pet_breed = $4, city_id = $5, area = $6, age = $7, description = $8, adoption_status = $9, min_age_of_children = $10, can_live_with_dogs = $11, can_live_with_cats = $12, must_have_someone_home = $13, energy_level = $14, cuddliness_level = $15, health_issues = $16 WHERE pet_id = $17 RETURNING *',
            [owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level, health_issues, pet_id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Pet not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json(result.rows[0], {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end(); 
    }
}

// DELETE method to delete a pet by ID
export async function DELETE(req: NextRequest): Promise<NextResponse> {
    const { pet_id } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('DELETE FROM pets WHERE pet_id = $1 RETURNING *', [pet_id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Pet not found' }, {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return NextResponse.json({ message: 'Pet deleted successfully' }, {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: 'Internal Server Error', message: (err as Error).message },
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            }
        );
    } finally {
        await client.end();
    }
}
