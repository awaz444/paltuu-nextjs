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
        await client.connect(); // Connect to the database
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