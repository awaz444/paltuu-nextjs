import { createClient } from "../../../db/index"; // Your custom database client
import { NextRequest, NextResponse } from "next/server";

// Interfaces
interface Vet {
    vet_id: number;
    vet_name: string;
    vet_email: string;
    profile_verified: boolean;
    qualifications: Qualification[];
}

interface Qualification {
    qualification_id: number;
    year_acquired: string;
    note: string;
    images: string[];
}

export async function GET(_: NextRequest) {
    const client = createClient(); // Initialize your custom database client (e.g., pg or ORM)

    try {
        await client.connect();
        console.log("Database connected");

        // Query to retrieve vets with unverified profiles and uploaded images
        const query = `
    SELECT 
        vets.vet_id AS vet_id,
        users.name AS vet_name,
        users.email AS vet_email,
        vets.profile_verified,
        vet_qualifications.qualification_id,
        vet_qualifications.year_acquired,
        vet_qualifications.note,
        vet_verification_application.image_url
    FROM 
        vets
    INNER JOIN 
        users ON vets.user_id = users.user_id
    INNER JOIN 
        vet_qualifications ON vets.vet_id = vet_qualifications.vet_id
    INNER JOIN 
        vet_verification_application 
        ON vet_qualifications.vet_id = vet_verification_application.vet_id 
        AND vet_qualifications.qualification_id = vet_verification_application.qualification_id
    WHERE 
        vets.profile_verified = FALSE
    ORDER BY 
        vets.vet_id, vet_qualifications.qualification_id;`;

        const result = await client.query(query);

        // Group results by vets
        const vets = result.rows.reduce((acc: Vet[], row: any) => {
            let vet = acc.find((v) => v.vet_id === row.vet_id);

            if (!vet) {
                vet = {
                    vet_id: row.vet_id,
                    vet_name: row.vet_name,
                    vet_email: row.vet_email,
                    profile_verified: row.profile_verified,
                    qualifications: [],
                };
                acc.push(vet);
            }

            let qualification = vet.qualifications.find(
                (q) => q.qualification_id === row.qualification_id
            );

            if (!qualification) {
                qualification = {
                    qualification_id: row.qualification_id,
                    year_acquired: row.year_acquired,
                    note: row.note,
                    images: [],
                };
                vet.qualifications.push(qualification);
            }

            qualification.images.push(row.image_url);

            return acc;
        }, []);

        return NextResponse.json({ vets }, { status: 200 });
    } catch (error) {
        console.error("Error fetching vets applied for verification:", error);
        return NextResponse.json(
            {
                error: "Failed to fetch vets",
                details: (error as Error).message,
            },
            { status: 500 }
        );
    } finally {
        try {
            await client.end();
            console.log("Database connection closed");
        } catch (error) {
            console.error("Error closing database connection:", error);
        }
    }
}
