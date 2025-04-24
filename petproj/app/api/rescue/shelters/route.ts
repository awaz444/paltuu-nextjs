// app/api/rescue/shelters/route.ts
import { createClient } from "../../../../db/index";
import { NextRequest, NextResponse } from "next/server";
import { IncomingForm } from "formidable";
import fs from "fs";
import path from "path";

export const config = {
    api: {
        bodyParser: false,
    },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
    const client = createClient();

    try {
        // Parse form data
        const formData = await new Promise<{ fields: any; files: any }>(
            (resolve, reject) => {
                const form = new IncomingForm();
                form.parse(req as any, (err, fields, files) => {
                    if (err) return reject(err);
                    resolve({ fields, files });
                });
            }
        );

        const {
            shelterName,
            address,
            description,
            accountTitle,
            iban,
            bankName,
            socials,
            animalTypes,
            capacity,
            emergencyPhone,
            backupPhone,
            vetName,
            vetPhone,
            userId,
            services,
        } = JSON.parse(formData.fields.data as string);

        await client.connect();
        await client.query("BEGIN");

        // 1. Insert into rescue_shelters
        const shelterResult = await client.query(
            `INSERT INTO rescue_shelters (
        user_id, shelter_name, address, description, 
        logo_url, capacity, approved
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING shelter_id`,
            [
                userId,
                shelterName,
                address,
                description,
                formData.files.logo
                    ? await saveFile(formData.files.logo[0])
                    : null,
                capacity,
                false,
            ]
        );

        const shelterId = shelterResult.rows[0].shelter_id;

        // 2. Insert shelter photos
        if (formData.files.photos) {
            const photoPromises = formData.files.photos.map(
                async (photo: any) =>
                    client.query(
                        "INSERT INTO shelter_photos (shelter_id, photo_url) VALUES ($1, $2)",
                        [shelterId, await saveFile(photo)]
                    )
            );
            await Promise.all(photoPromises);
        }

        // 3. Insert bank info
        await client.query(
            `INSERT INTO shelter_bank_info (
        shelter_id, account_title, iban, bank_name
      ) VALUES ($1, $2, $3, $4)`,
            [shelterId, accountTitle, iban, bankName]
        );

        // 4. Insert social media links
        const socialsObj = JSON.parse(socials);
        const socialPromises = [
            { platform: "Instagram", url: socialsObj.instagram },
            { platform: "Facebook", url: socialsObj.facebook },
            { platform: "Website", url: socialsObj.website },
        ]
            .filter((social) => social.url)
            .map((social) =>
                client.query(
                    "INSERT INTO shelter_socials (shelter_id, platform, url) VALUES ($1, $2, $3)",
                    [shelterId, social.platform, social.url]
                )
            );
        await Promise.all(socialPromises);

        // 5. Insert verification docs
        await client.query(
            `INSERT INTO shelter_verification (
        shelter_id, reg_certificate_url, cnic_front_url, cnic_back_url
      ) VALUES ($1, $2, $3, $4)`,
            [
                shelterId,
                formData.files.regCert
                    ? await saveFile(formData.files.regCert[0])
                    : null,
                formData.files.cnicFront
                    ? await saveFile(formData.files.cnicFront[0])
                    : null,
                formData.files.cnicBack
                    ? await saveFile(formData.files.cnicBack[0])
                    : null,
            ]
        );

        // 6. Insert animal types
        const animalTypesArray = JSON.parse(animalTypes);
        const animalPromises = animalTypesArray.map((animalType: number) =>
            client.query(
                "INSERT INTO shelter_animals (shelter_id, animal_type) VALUES ($1, $2)",
                [shelterId, animalType]
            )
        );
        await Promise.all(animalPromises);

        // 7. Insert emergency contacts
        await client.query(
            `INSERT INTO shelter_emergency_contacts (
        shelter_id, primary_phone, backup_phone, vet_name, vet_phone
      ) VALUES ($1, $2, $3, $4, $5)`,
            [shelterId, emergencyPhone, backupPhone, vetName, vetPhone]
        );

        // 8. Insert services
        const servicesArray = JSON.parse(services);
        const servicePromises = servicesArray.map((service: string) =>
            client.query(
                "INSERT INTO shelter_services (shelter_id, service) VALUES ($1, $2)",
                [shelterId, service]
            )
        );
        await Promise.all(servicePromises);

        await client.query("COMMIT");

        return NextResponse.json(
            { success: true, shelterId },
            {
                status: 201,
                headers: { "Content-Type": "application/json" },
            }
        );
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Error creating shelter:", err);
        return NextResponse.json(
            { error: "Internal Server Error", message: (err as Error).message },
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    } finally {
        await client.end();
    }
}

// Helper function to save files (replace with your actual file storage solution)
async function saveFile(file: any): Promise<string> {
    // In production, you would upload to S3/Cloudinary/etc.
    // This is just a temporary solution for local development
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    const newPath = path.join(
        uploadDir,
        file.originalFilename || `file-${Date.now()}`
    );
    await fs.promises.rename(file.filepath, newPath);

    return `/uploads/${path.basename(newPath)}`;
}
