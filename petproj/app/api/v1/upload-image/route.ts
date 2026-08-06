import { NextRequest, NextResponse } from "next/server";
import { uploadToS3Main } from "@/lib/s3";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";
import { sendNewListingNotification } from "@/utils/mailjet";
import { withRetry } from "@/utils/retry";

/**
 * @swagger
 * /api/upload-image:
 *   post:
 *     summary: Upload images to AWS S3 (paltuu-main/adoption) and save to pet_images
 *     description: Upload multiple images and return their URLs. If pet_id is provided, saves URLs to pet_images table.
 *     tags: [Upload]
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const contentLength = Number(req.headers.get("content-length") || "0");
        if (contentLength > 20 * 1024 * 1024) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const petId = formData.get("pet_id");
        const notifyNewListing = formData.get("notify_new_listing") === "true";

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        if (files.length > 10) {
            return NextResponse.json({ error: "Maximum 10 files per upload" }, { status: 400 });
        }

        const urls: string[] = [];

        for (const file of files) {
            if (!file.type.startsWith("image/")) {
                return NextResponse.json({ error: "Only image uploads are allowed" }, { status: 400 });
            }

            if (file.size > 5 * 1024 * 1024) {
                return NextResponse.json({ error: "Each file must be 5 MB or smaller" }, { status: 413 });
            }

            const buffer = Buffer.from(await file.arrayBuffer());
            const ext = file.type.split("/")[1] || "jpg";
            const imageUrl = await withRetry(
                () => uploadToS3Main(buffer, "adoption", file.type, ext),
                { label: `S3 upload (${file.name || "image"})` }
            );
            urls.push(imageUrl);
        }

        // If pet_id was provided, persist URLs into pet_images table
        if (petId) {
            for (let i = 0; i < urls.length; i++) {
                await withRetry(
                    () => db.query(
                        `INSERT INTO pet_images (pet_id, image_url, "order") VALUES ($1, $2, $3)`,
                        [petId, urls[i], i]
                    ),
                    { label: "insert pet_images row" }
                );
            }
        }

        // Fire-and-forget: notify admin now that the listing has its photos.
        // Only fires when explicitly requested by the create-listing flow —
        // this endpoint is also used for edits (admin-pet, vet modal, etc.)
        // which shouldn't re-trigger a "new listing" email.
        if (petId && notifyNewListing) {
            Promise.resolve().then(async () => {
                try {
                    const petRes = await db.query(
                        `SELECT
                            p.pet_id, p.pet_name, p.pet_breed, p.area, p.age_months, p.sex,
                            p.description, p.health_issues, p.rescue_story, p.listing_type,
                            p.vaccinated, p.neutered, p.contact_number,
                            pc.category_name AS pet_type,
                            c.city_name AS city,
                            u.name AS owner_name, u.email AS owner_email
                         FROM pets p
                         LEFT JOIN pet_category pc ON pc.category_id = p.pet_type
                         LEFT JOIN cities c ON c.city_id = p.city_id
                         JOIN users u ON u.user_id = p.owner_id
                         WHERE p.pet_id = $1`,
                        [petId]
                    );
                    const pet = petRes.rows[0];
                    if (!pet) return;

                    await sendNewListingNotification({
                        pet_id: pet.pet_id,
                        pet_name: pet.pet_name,
                        pet_type: pet.pet_type || 'Unknown',
                        listing_type: pet.listing_type,
                        owner_name: pet.owner_name,
                        owner_email: pet.owner_email,
                        owner_phone: pet.contact_number,
                        city: pet.city,
                        area: pet.area,
                        pet_breed: pet.pet_breed,
                        age_months: pet.age_months,
                        sex: pet.sex,
                        description: pet.description,
                        health_issues: pet.health_issues,
                        rescue_story: pet.rescue_story,
                        vaccinated: pet.vaccinated,
                        neutered: pet.neutered,
                        image_urls: urls,
                    });
                } catch (err) {
                    console.error('❌ [upload-image/POST] listing notification email failed:', err);
                }
            });
        }

        return NextResponse.json({ urls });
    } catch (error) {
        console.error("Upload Image Error:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
