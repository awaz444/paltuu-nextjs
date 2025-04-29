export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../db/index";

export async function GET(req: NextRequest, { params }: { params: { shelter_id: string } }): Promise<NextResponse> {
    const client = createClient();
    const { shelter_id } = params;

    if (!shelter_id) {
        return NextResponse.json(
            { error: "Bad Request", message: "Missing shelter_id parameter" },
            { status: 400 }
        );
    }

    try {
        await client.connect();

        const query = `
        SELECT
            rs.shelter_id,
            rs.shelter_name,
            rs.address,
            rs.description,
            rs.logo_url,
            rs.capacity,
            rs.created_at,
            sa.animal_type,
            sp.photo_url,
            sb.account_title,
            sb.iban,
            sb.bank_name,
            ss.platform,
            ss.url AS social_url,
            sv.reg_certificate_url,
            sv.cnic_front_url,
            sv.cnic_back_url,
            sec.primary_phone,
            sec.backup_phone,
            sec.vet_name,
            sec.vet_phone
        FROM rescue_shelters rs
        LEFT JOIN shelter_animals sa ON rs.shelter_id = sa.shelter_id
        LEFT JOIN shelter_photos sp ON rs.shelter_id = sp.shelter_id
        LEFT JOIN shelter_bank_info sb ON rs.shelter_id = sb.shelter_id
        LEFT JOIN shelter_socials ss ON rs.shelter_id = ss.shelter_id
        LEFT JOIN shelter_verification sv ON rs.shelter_id = sv.shelter_id
        LEFT JOIN shelter_emergency_contacts sec ON rs.shelter_id = sec.shelter_id
        WHERE rs.shelter_id = $1;
        `;

        const result = await client.query(query, [shelter_id]);

        if (result.rows.length === 0) {
            return NextResponse.json(
                { error: "Not Found", message: "Shelter not found" },
                { status: 404 }
            );
        }

        const shelterData = result.rows[0];

        // Process result to return a structured response
        const shelter = {
            shelter_id: shelterData.shelter_id,
            shelter_name: shelterData.shelter_name,
            address: shelterData.address,
            description: shelterData.description,
            logo_url: shelterData.logo_url,
            capacity: shelterData.capacity,
            animalTypes: [] as string[],
            photos: [] as string[],
            bankInfo: {
                account_title: shelterData.account_title,
                iban: shelterData.iban,
                bank_name: shelterData.bank_name,
            },
            socials: [] as { platform: string; url: string }[],
            verification: {
                reg_certificate_url: shelterData.reg_certificate_url,
                cnic_front_url: shelterData.cnic_front_url,
                cnic_back_url: shelterData.cnic_back_url,
            },
            emergencyContacts: {
                primary_phone: shelterData.primary_phone,
                backup_phone: shelterData.backup_phone,
                vet_name: shelterData.vet_name,
                vet_phone: shelterData.vet_phone,
            },
        };

        // Collect animal types
        if (shelterData.animal_type) {
            shelter.animalTypes.push(shelterData.animal_type);
        }

        // Collect photos
        if (shelterData.photo_url) {
            shelter.photos.push(shelterData.photo_url);
        }

        // Collect social links
        if (shelterData.platform && shelterData.social_url) {
            shelter.socials.push({
                platform: shelterData.platform,
                url: shelterData.social_url,
            });
        }

        return NextResponse.json(shelter, {
            status: 200,
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
