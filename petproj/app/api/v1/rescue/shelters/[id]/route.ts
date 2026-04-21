import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";

export async function GET(req: NextRequest) {
    try {
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        // 1. Fetch Main Shelter Data & Owner/Contact Info
        const shelterRes = await db.query(`
            SELECT 
                rs.*,
                u.user_id, u.name, u.email, u.phone_number, u.profile_image_url
            FROM rescue_shelters rs
            JOIN users u ON rs.user_id = u.user_id
            WHERE rs.shelter_id = $1
        `, [id]);

        if ((shelterRes.rowCount ?? 0) === 0) {
            return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
        }

        const shelterRow = shelterRes.rows[0];

        // 2. Fetch Related Data in Parallel
        const [bankRes, petsRes] = await Promise.all([
            db.query('SELECT * FROM shelter_bank_info WHERE shelter_id = $1', [id]),
            db.query(`
                SELECT 
                    p.*,
                    (SELECT image_url FROM rescue_images WHERE pet_id = p.pet_id LIMIT 1) as image_url
                FROM pets p 
                WHERE p.shelter_id = $1 AND p.listing_type = 'rescue'
                ORDER BY p.created_at DESC
            `, [id])
        ]);

        // Construct the expected structure
        const shelterData = {
            shelter_id: shelterRow.shelter_id,
            shelter_name: shelterRow.shelter_name,
            address: shelterRow.address,
            description: shelterRow.description,
            logo_url: shelterRow.logo_url,
            capacity: shelterRow.capacity,
            created_at: shelterRow.created_at,
            approved: shelterRow.approved,
            contact: {
                user_id: shelterRow.user_id,
                name: shelterRow.name,
                email: shelterRow.email,
                phone_number: shelterRow.phone_number,
                profile_image_url: shelterRow.profile_image_url
            },
            bank_info: (bankRes.rowCount ?? 0) > 0 ? bankRes.rows[0] : null,
            pets: petsRes.rows,
            emergency_contacts: null,
            social_media: [],
            facility_photos: [],
            animal_types: []
        };

        return NextResponse.json(shelterData);

    } catch (error) {
        console.error("V1 Shelter Detail GET error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const id = req.nextUrl.pathname.split("/").pop();
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        // Ensure user owns the shelter or is admin
        const checkOwner = await db.query('SELECT user_id FROM rescue_shelters WHERE shelter_id = $1', [id]);
        if (checkOwner.rowCount === 0) return NextResponse.json({ error: "Shelter not found" }, { status: 404 });
        
        if (checkOwner.rows[0].user_id !== userId) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await req.json();
        const { shelter_name, address, description, capacity, logo_url, bank_info } = body;

        await db.query('BEGIN');
        try {
            const updateShelter = `
                UPDATE rescue_shelters SET
                    shelter_name = COALESCE($1, shelter_name),
                    address = COALESCE($2, address),
                    description = COALESCE($3, description),
                    capacity = COALESCE($4, capacity::integer, capacity),
                    logo_url = COALESCE($5, logo_url),
                    updated_at = CURRENT_TIMESTAMP
                WHERE shelter_id = $6
            `;
            await db.query(updateShelter, [shelter_name, address, description, capacity, logo_url, id]);

            if (bank_info) {
                const { account_title, iban, bank_name } = bank_info;
                const updateBank = `
                    INSERT INTO shelter_bank_info (shelter_id, account_title, iban, bank_name, updated_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (shelter_id) 
                    DO UPDATE SET 
                        account_title = EXCLUDED.account_title,
                        iban = EXCLUDED.iban,
                        bank_name = EXCLUDED.bank_name,
                        updated_at = CURRENT_TIMESTAMP
                `;
                await db.query(updateBank, [id, account_title, iban, bank_name]);
            }

            await db.query('COMMIT');
            return NextResponse.json({ success: true, message: "Shelter updated successfully" });

        } catch (e) {
            await db.query('ROLLBACK');
            throw e;
        }

    } catch (error) {
        console.error("V1 Shelter Detail PUT error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
