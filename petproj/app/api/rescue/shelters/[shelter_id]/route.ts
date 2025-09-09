import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest, { params }: { params: { shelter_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { shelter_id } = params;

    if (!shelter_id || isNaN(parseInt(shelter_id))) {
        return NextResponse.json(
            { error: "Valid shelter ID is required" },
            { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    try {
        await client.connect();

        // Query to fetch shelter details along with related information
        const shelterQuery = `
        SELECT 
            rs.shelter_id,
            rs.shelter_name,
            rs.address,
            rs.description,
            rs.logo_url,
            rs.capacity,
            rs.created_at,
            rs.approved,
            u.user_id,
            u.name as contact_name,
            u.email,
            u.phone_number,
            u.profile_image_url as contact_image,
            sbi.account_title,
            sbi.iban,
            sbi.bank_name,
            sec.primary_phone,
            sec.backup_phone,
            sec.vet_name,
            sec.vet_phone,
            ss.platform as social_platform,
            ss.url as social_url,
            sp.photo_url as facility_photo,
            sv.reg_certificate_url,
            sv.cnic_front_url,
            sv.cnic_back_url,
            sa.animal_type,
            pc.category_name as animal_type_name
        FROM rescue_shelters rs
        JOIN users u ON rs.user_id = u.user_id
        LEFT JOIN shelter_bank_info sbi ON rs.shelter_id = sbi.shelter_id
        LEFT JOIN shelter_emergency_contacts sec ON rs.shelter_id = sec.shelter_id
        LEFT JOIN shelter_socials ss ON rs.shelter_id = ss.shelter_id
        LEFT JOIN shelter_photos sp ON rs.shelter_id = sp.shelter_id
        LEFT JOIN shelter_verification sv ON rs.shelter_id = sv.shelter_id
        LEFT JOIN shelter_animals sa ON rs.shelter_id = sa.shelter_id
        LEFT JOIN pet_category pc ON sa.animal_type = pc.category_id
        WHERE rs.shelter_id = $1 AND rs.approved = true
        `;

        const shelterResult = await client.query(shelterQuery, [shelter_id]);

        if (shelterResult.rows.length === 0) {
            return NextResponse.json(
                { error: "Shelter not found or not approved" },
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Query to fetch available pets for this shelter
        const petsQuery = `
        SELECT 
            p.pet_id,
            p.pet_name,
            p.pet_type,
            p.pet_breed,
            p.age,
            p.months,
            p.description,
            p.adoption_status,
            p.price,
            p.sex,
            p.listing_type,
            p.vaccinated,
            p.neutered,
            p.created_at,
            c.city_name as city,
            pi.image_id,
            pi.image_url,
            pi.order as image_order
        FROM pets p
        JOIN cities c ON p.city_id = c.city_id
        LEFT JOIN pet_images pi ON p.pet_id = pi.pet_id
        WHERE p.shelter_id = $1 
            AND p.adoption_status = 'available'
            AND p.approved = true
        ORDER BY p.created_at DESC
        `;

        const petsResult = await client.query(petsQuery, [shelter_id]);

        // Process shelter data
        const shelterData = shelterResult.rows[0];
        const response: any = {
            shelter_id: shelterData.shelter_id,
            shelter_name: shelterData.shelter_name,
            address: shelterData.address,
            description: shelterData.description,
            logo_url: shelterData.logo_url,
            capacity: shelterData.capacity,
            created_at: shelterData.created_at,
            approved: shelterData.approved,
            contact: {
                user_id: shelterData.user_id,
                name: shelterData.contact_name,
                email: shelterData.email,
                phone_number: shelterData.phone_number,
                profile_image_url: shelterData.contact_image
            },
            bank_info: shelterData.account_title ? {
                account_title: shelterData.account_title,
                iban: shelterData.iban,
                bank_name: shelterData.bank_name
            } : null,
            emergency_contacts: shelterData.primary_phone ? {
                primary_phone: shelterData.primary_phone,
                backup_phone: shelterData.backup_phone,
                vet_name: shelterData.vet_name,
                vet_phone: shelterData.vet_phone
            } : null,
            social_media: [],
            facility_photos: [],
            verification: shelterData.reg_certificate_url ? {
                reg_certificate_url: shelterData.reg_certificate_url,
                cnic_front_url: shelterData.cnic_front_url,
                cnic_back_url: shelterData.cnic_back_url
            } : null,
            animal_types: []
        };

        // Process related data that might have multiple rows
        shelterResult.rows.forEach(row => {
            if (row.social_platform && !response.social_media.find((s: any) => s.platform === row.social_platform)) {
                response.social_media.push({
                    platform: row.social_platform,
                    url: row.social_url
                });
            }

            if (row.facility_photo && !response.facility_photos.includes(row.facility_photo)) {
                response.facility_photos.push(row.facility_photo);
            }

            if (row.animal_type && !response.animal_types.find((a: any) => a.id === row.animal_type)) {
                response.animal_types.push({
                    id: row.animal_type,
                    name: row.animal_type_name
                });
            }
        });

        // Process pets data
        const petsMap = new Map();
        petsResult.rows.forEach(row => {
            if (!petsMap.has(row.pet_id)) {
                petsMap.set(row.pet_id, {
                    pet_id: row.pet_id,
                    pet_name: row.pet_name,
                    pet_type: row.pet_type,
                    pet_breed: row.pet_breed,
                    age: row.age,
                    months: row.months,
                    description: row.description,
                    adoption_status: row.adoption_status,
                    price: row.price,
                    sex: row.sex,
                    listing_type: row.listing_type,
                    vaccinated: row.vaccinated,
                    neutered: row.neutered,
                    created_at: row.created_at,
                    city: row.city,
                    images: []
                });
            }
            
            if (row.image_id) {
                const pet = petsMap.get(row.pet_id);
                pet.images.push({
                    image_id: row.image_id,
                    image_url: row.image_url,
                    order: row.image_order
                });
            }
        });

        response.pets = Array.from(petsMap.values());

        return NextResponse.json(response, {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (err) {
        console.error(err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        await client.end();
    }
}