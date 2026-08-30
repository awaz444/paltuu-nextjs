import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { uploadToS3Main } from "@/lib/s3";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";
import { sendNewListingNotification } from "@/utils/mailjet";
import { withRetry } from "@/utils/retry";

// Per-file cap on the *original* upload. This is generous on purpose — HEIC
// straight off an iPhone and high-res camera JPEGs routinely land in the
// 10-20 MB range. Everything is re-encoded to WebP below, so what actually
// gets stored is a fraction of this.
const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
// Cap on the whole multipart request (all files + overhead). Keep this in
// sync with whatever the hosting platform allows for a request body.
const MAX_REQUEST_BYTES = 60 * 1024 * 1024; // 60 MB
// Longest edge kept after downscaling. 2560px is plenty for full-bleed
// display and keeps the stored file small.
const MAX_EDGE = 2560;
const MAX_FILES = 10;

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
        if (contentLength > MAX_REQUEST_BYTES) {
            return NextResponse.json({ error: "Payload too large" }, { status: 413 });
        }

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];
        const petId = formData.get("pet_id");
        const notifyNewListing = formData.get("notify_new_listing") === "true";

        if (!files || files.length === 0) {
            return NextResponse.json({ error: "No files provided" }, { status: 400 });
        }

        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Maximum ${MAX_FILES} files per upload` }, { status: 400 });
        }

        const urls: string[] = [];

        for (const file of files) {
            const mimeType = (file.type || "").toLowerCase();

            // SVG is rejected outright: it's a markup format that can carry
            // <script>, so serving user-supplied SVGs from our CDN is an XSS
            // vector. Everything else is handed to sharp, which is the real
            // gate — if it can decode the bytes, we accept it, regardless of
            // what the browser claimed the MIME type was (HEIC/HEIF often
            // arrive with an empty or wrong type from non-Safari browsers).
            if (mimeType === "image/svg+xml" || (file.name || "").toLowerCase().endsWith(".svg")) {
                return NextResponse.json({ error: "SVG images aren't supported. Please upload a JPG, PNG, HEIC or WebP." }, { status: 400 });
            }

            if (file.size > MAX_FILE_BYTES) {
                return NextResponse.json(
                    { error: `Each file must be ${Math.floor(MAX_FILE_BYTES / 1024 / 1024)} MB or smaller` },
                    { status: 413 }
                );
            }

            const original = Buffer.from(await file.arrayBuffer());

            // Normalize + compress every upload:
            //  - failOnError:false tolerates minor HEIC header quirks
            //  - .rotate() bakes in EXIF orientation (iPhone photos)
            //  - downscale only if larger than MAX_EDGE (never upscale)
            //  - re-encode to WebP; strips EXIF/GPS metadata as a side effect
            let optimized: Buffer;
            try {
                optimized = await sharp(original, { failOnError: false })
                    .rotate()
                    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
                    .webp({ quality: 80 })
                    .toBuffer();
            } catch (sharpErr) {
                console.error(`[upload-image] sharp failed for ${file.name || "image"}:`, sharpErr instanceof Error ? sharpErr.message : sharpErr);
                return NextResponse.json(
                    { error: `"${file.name || "That file"}" isn't a readable image. Try saving it as JPG or PNG and re-uploading.` },
                    { status: 400 }
                );
            }

            const imageUrl = await withRetry(
                () => uploadToS3Main(optimized, "adoption", "image/webp", "webp"),
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
