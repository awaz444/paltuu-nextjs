import { createClient } from '../../../db/index.js';

export async function POST(req) {
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

        return new Response(JSON.stringify(result.rows[0]), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end(); // Always close the connection
    }
}

export async function GET(req) {
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('SELECT * FROM pets'); 
        return new Response(JSON.stringify(result.rows), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end(); 
    }
}

export async function PUT(req) {
    const { pet_id, owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, adoption_price, min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level, health_issues } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query(
            'UPDATE pets SET owner_id = $1, pet_name = $2, pet_type = $3, pet_breed = $4, city_id = $5, area = $6, age = $7, description = $8, adoption_status = $9, adoption_price = $10, min_age_of_children = $11, can_live_with_dogs = $12, can_live_with_cats = $13, must_have_someone_home = $14, energy_level = $15, cuddliness_level = $16, health_issues = $17 WHERE pet_id = $18 RETURNING *',
            [owner_id, pet_name, pet_type, pet_breed, city_id, area, age, description, adoption_status, adoption_price, min_age_of_children, can_live_with_dogs, can_live_with_cats, must_have_someone_home, energy_level, cuddliness_level, health_issues, pet_id]
        );

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Pet not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify(result.rows[0]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end(); 
    }
}

export async function DELETE(req) {
    const { pet_id } = await req.json();
    const client = createClient();

    try {
        await client.connect(); 
        const result = await client.query('DELETE FROM pets WHERE pet_id = $1 RETURNING *', [pet_id]);

        if (result.rows.length === 0) {
            return new Response(JSON.stringify({ error: 'Pet not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ message: 'Pet deleted successfully' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ error: 'Internal Server Error', message: err.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    } finally {
        await client.end();
    }
}