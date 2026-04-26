/**
 * AWS S3 client — singleton for the paltuu-social bucket
 *
 * Bucket structure:
 *   paltuu-social/posts/         ← social post images & videos
 *   paltuu-social/covers/        ← user cover photos
 *   paltuu-social/profile-pics/  ← user profile pictures
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

const REGION = process.env.AWS_S3_REGION || "ap-south-1";
const BUCKET = process.env.AWS_S3_BUCKET_SOCIAL || "paltuu-social";

let _s3: S3Client | null = null;

function getS3(): S3Client {
    if (_s3) return _s3;
    _s3 = new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    return _s3;
}

export type S3Folder = "posts" | "covers" | "profile-pics";

/**
 * Upload a buffer directly to S3.
 * Returns the public HTTPS URL.
 */
export async function uploadToS3(
    buffer: Buffer,
    folder: S3Folder,
    mimeType: string,
    extension: string = "webp"
): Promise<string> {
    const key = `${folder}/${uuidv4()}.${extension}`;

    await getS3().send(
        new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
            // Public read — images served directly via S3 URL
            // (set bucket policy to allow public GetObject instead of ACL)
        })
    );

    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

/**
 * Delete a file from S3 by its full URL or key.
 */
export async function deleteFromS3(urlOrKey: string): Promise<void> {
    // Extract key from full URL if needed
    const key = urlOrKey.startsWith("https://")
        ? urlOrKey.split(".amazonaws.com/")[1]
        : urlOrKey;

    if (!key) return;

    await getS3().send(
        new DeleteObjectCommand({ Bucket: BUCKET, Key: key })
    );
}

/**
 * Generate a pre-signed URL for direct browser uploads (optional — for mobile).
 * The mobile app can upload directly to S3 without going through the server.
 */
export async function getPresignedUploadUrl(
    folder: S3Folder,
    mimeType: string,
    extension: string = "webp",
    expiresInSeconds: number = 300
): Promise<{ uploadUrl: string; fileUrl: string }> {
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(getS3(), command, { expiresIn: expiresInSeconds });
    const fileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;

    return { uploadUrl, fileUrl };
}
