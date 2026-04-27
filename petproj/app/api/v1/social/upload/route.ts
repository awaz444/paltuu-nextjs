import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { getUserIdFromRequest } from "@/utils/authServer";
import { uploadToS3 } from "@/lib/s3";

export const dynamic = "force-dynamic";

// ── BlurHash generator ──────────────────────────────────────────────────────
const B83 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~";

function b83Encode(value: number, length: number): string {
    let result = "";
    for (let i = 1; i <= length; i++) {
        result += B83[Math.floor(value / Math.pow(83, length - i)) % 83];
    }
    return result;
}

function toLinear(v: number) {
    const n = v / 255;
    return n <= 0.04045 ? n / 12.92 : Math.pow((n + 0.055) / 1.055, 2.4);
}

function toSrgb(v: number) {
    const c = Math.max(0, Math.min(1, v));
    return c <= 0.0031308 ? Math.round(c * 12.92 * 255) : Math.round((1.055 * Math.pow(c, 1 / 2.4) - 0.055) * 255);
}

async function generateBlurHash(buffer: Buffer): Promise<string> {
    try {
        const { data, info } = await sharp(buffer)
            .resize(8, 8, { fit: "fill" })
            .raw()
            .toBuffer({ resolveWithObject: true });

        const ch = info.channels;
        const count = info.width * info.height;
        let r = 0, g = 0, b = 0;

        for (let i = 0; i < count; i++) {
            r += toLinear(data[i * ch]);
            g += toLinear(data[i * ch + 1]);
            b += toLinear(data[i * ch + 2]);
        }

        const colorInt = (toSrgb(r / count) << 16) | (toSrgb(g / count) << 8) | toSrgb(b / count);
        return b83Encode(colorInt, 4);
    } catch {
        return "hazy";
    }
}

/**
 * POST /api/v1/social/upload
 * Upload images or videos for social posts → stored in S3 paltuu-social/posts/
 *
 * Request: multipart/form-data, field "files" (up to 10 files)
 * Response: { media: [{ url, thumbnail_url, media_type, blurhash, width, height, ordering }] }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const formData = await req.formData();
        const files = formData.getAll("files") as File[];

        if (!files || files.length === 0)
            return NextResponse.json({ error: "No files provided" }, { status: 400 });

        if (files.length > 10)
            return NextResponse.json({ error: "Maximum 10 files per upload" }, { status: 400 });

        const results: {
            url: string;
            thumbnail_url: string | null;
            media_type: string;
            blurhash: string;
            width: number;
            height: number;
            ordering: number;
        }[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const buffer = Buffer.from(await file.arrayBuffer());
            const isVideo = file.type.startsWith("video/");

            if (isVideo) {
                // Upload raw video to S3 posts/ folder
                const ext = file.name.split(".").pop() || "mp4";
                const url = await uploadToS3(buffer, "posts", file.type, ext);

                // Generate a thumbnail from first frame via Sharp (for video/gif support, limited)
                // In production, use AWS MediaConvert or Lambda for proper video thumbnails
                results.push({
                    url,
                    thumbnail_url: null, // Set up MediaConvert for proper video thumbnails
                    media_type: "video",
                    blurhash: "video",
                    width: 0,
                    height: 0,
                    ordering: i,
                });

            } else {
                // 1. Optimize image: resize to max 1200px, convert to JPEG
                const [optimizedBuffer, meta] = await Promise.all([
                    sharp(buffer)
                        .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
                        .jpeg({ quality: 85 })
                        .toBuffer(),
                    sharp(buffer).metadata(),
                ]);

                // 2. Generate BlurHash and thumbnail concurrently
                const [blurhash, thumbnailBuffer] = await Promise.all([
                    generateBlurHash(buffer),
                    sharp(buffer)
                        .resize(600, 600, { fit: "inside", withoutEnlargement: true })
                        .jpeg({ quality: 70 })
                        .toBuffer(),
                ]);

                // 3. Upload full + thumbnail to S3 posts/ folder
                const [url, thumbnail_url] = await Promise.all([
                    uploadToS3(optimizedBuffer, "posts", "image/jpeg", "jpg"),
                    uploadToS3(thumbnailBuffer, "posts", "image/jpeg", "jpg"),
                ]);

                results.push({
                    url,
                    thumbnail_url,
                    media_type: "image",
                    blurhash,
                    width: meta.width ?? 0,
                    height: meta.height ?? 0,
                    ordering: i,
                });
            }
        }

        return NextResponse.json({ media: results }, { status: 201 });

    } catch (error) {
        console.error("Social S3 Upload Error:", error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : "Internal Server Error"
        }, { status: 500 });
    }
}

/**
 * GET /api/v1/social/upload/presign
 * Get a pre-signed URL for direct mobile-to-S3 upload (bypasses server for large files)
 *
 * Query: ?folder=posts|covers|profile-pics&mime=image/webp&ext=webp
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const folder = (searchParams.get("folder") || "posts") as "posts" | "covers" | "profile-pics";
        const mime = searchParams.get("mime") || "image/webp";
        const ext = searchParams.get("ext") || "webp";

        const validFolders = ["posts", "covers", "profile-pics"];
        if (!validFolders.includes(folder)) {
            return NextResponse.json({ error: "Invalid folder. Use: posts, covers, profile-pics" }, { status: 400 });
        }

        const { getPresignedUploadUrl } = await import("@/lib/s3");
        const { uploadUrl, fileUrl } = await getPresignedUploadUrl(folder, mime, ext);

        return NextResponse.json({ upload_url: uploadUrl, file_url: fileUrl });

    } catch (error) {
        console.error("Social S3 Presign Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
