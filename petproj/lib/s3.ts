/**
 * AWS S3 client — singleton instances for Paltuu S3 buckets
 *
 * paltuu-social bucket structure:
 *   paltuu-social/posts/         ← social post images & videos
 *   paltuu-social/covers/        ← user cover photos
 *   paltuu-social/profile-pics/  ← user profile pictures
 *
 * paltuu-main bucket structure:
 *   paltuu-main/adoption/        ← pet adoption listing images
 *   paltuu-main/vets/            ← vet profile images
 *   paltuu-main/shelter/         ← shelter facility images
 *   paltuu-main/kyc/             ← verification / KYC documents
 *   paltuu-main/lostandfound/    ← lost & found post images
 *   paltuu-main/users/           ← general user assets
 */

import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// ─── paltuu-social ───────────────────────────────────────────────────────────

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

// ─── paltuu-main ─────────────────────────────────────────────────────────────

const MAIN_REGION = process.env.AWS_S3_REGION_MAIN || process.env.AWS_S3_REGION || "ap-south-1";
const MAIN_BUCKET = process.env.AWS_S3_BUCKET_MAIN || "paltuu-main";

export type S3MainFolder = "adoption" | "vets" | "shelter" | "kyc" | "lostandfound" | "users";

let _s3Main: S3Client | null = null;

function getS3Main(): S3Client {
    if (_s3Main) return _s3Main;
    _s3Main = new S3Client({
        region: MAIN_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    return _s3Main;
}

/**
 * Converts a raw paltuu-main S3 URL to a CloudFront CDN URL.
 * Uses AWS_CLOUDFRONT_DOMAIN_MAIN env var. Falls back to S3 URL if not set.
 */
export function toMainCdnUrl(s3Url: string): string {
    const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN_MAIN;
    if (!cfDomain) return s3Url;
    return s3Url.replace(
        /^https:\/\/[^/]+\.amazonaws\.com\//,
        `https://${cfDomain}/`
    );
}

/**
 * Upload a buffer directly to the paltuu-main S3 bucket.
 * Returns a CloudFront CDN URL if AWS_CLOUDFRONT_DOMAIN_MAIN is set,
 * otherwise returns the raw S3 URL.
 */
export async function uploadToS3Main(
    buffer: Buffer,
    folder: S3MainFolder,
    mimeType: string,
    extension: string = "webp"
): Promise<string> {
    const key = `${folder}/${uuidv4()}.${extension}`;

    await getS3Main().send(
        new PutObjectCommand({
            Bucket: MAIN_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: mimeType,
        })
    );

    const s3Url = `https://${MAIN_BUCKET}.s3.${MAIN_REGION}.amazonaws.com/${key}`;
    return toMainCdnUrl(s3Url);
}

/**
 * Delete a file from paltuu-main S3 by its full URL (S3 or CloudFront) or bare key.
 */
export async function deleteFromS3Main(urlOrKey: string): Promise<void> {
    let key: string | undefined;

    if (urlOrKey.startsWith("https://")) {
        const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN_MAIN;
        if (cfDomain && urlOrKey.includes(cfDomain)) {
            key = new URL(urlOrKey).pathname.slice(1);
        } else {
            key = urlOrKey.split(".amazonaws.com/")[1];
        }
    } else {
        key = urlOrKey;
    }

    if (!key) return;

    await getS3Main().send(
        new DeleteObjectCommand({ Bucket: MAIN_BUCKET, Key: key })
    );
}

/**
 * Generate a pre-signed URL for direct mobile uploads to paltuu-main.
 */
export async function getPresignedUploadUrlMain(
    folder: S3MainFolder,
    mimeType: string,
    extension: string = "webp",
    expiresInSeconds: number = 300
): Promise<{ uploadUrl: string; fileUrl: string }> {
    const key = `${folder}/${uuidv4()}.${extension}`;

    const command = new PutObjectCommand({
        Bucket: MAIN_BUCKET,
        Key: key,
        ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(getS3Main(), command, { expiresIn: expiresInSeconds });
    const s3FileUrl = `https://${MAIN_BUCKET}.s3.${MAIN_REGION}.amazonaws.com/${key}`;
    const fileUrl = toMainCdnUrl(s3FileUrl);

    return { uploadUrl, fileUrl };
}

/**
 * Converts a raw S3 URL to a CloudFront CDN URL.
 * If AWS_CLOUDFRONT_DOMAIN is not set, returns the S3 URL unchanged.
 */
export function toCdnUrl(s3Url: string): string {
    const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
    if (!cfDomain) return s3Url; // CloudFront not configured yet

    // Replace https://bucket.s3.region.amazonaws.com/ with https://cf-domain/
    return s3Url.replace(
        /^https:\/\/[^/]+\.amazonaws\.com\//,
        `https://${cfDomain}/`
    );
}

/**
 * Upload a buffer directly to S3.
 * Returns a CloudFront CDN URL if AWS_CLOUDFRONT_DOMAIN is set,
 * otherwise returns the raw S3 URL.
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
        })
    );

    const s3Url = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    return toCdnUrl(s3Url); // ← automatically CDN URL when CloudFront is set
}

/**
 * Delete a file from S3 by its full URL (S3 or CloudFront) or bare key.
 */
export async function deleteFromS3(urlOrKey: string): Promise<void> {
    let key: string | undefined;

    if (urlOrKey.startsWith("https://")) {
        const cfDomain = process.env.AWS_CLOUDFRONT_DOMAIN;
        if (cfDomain && urlOrKey.includes(cfDomain)) {
            // CloudFront URL: https://d123.cloudfront.net/posts/xyz.webp
            key = new URL(urlOrKey).pathname.slice(1); // remove leading /
        } else {
            // S3 URL: https://bucket.s3.region.amazonaws.com/posts/xyz.webp
            key = urlOrKey.split(".amazonaws.com/")[1];
        }
    } else {
        key = urlOrKey; // bare key
    }

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
    // Return CDN URL for the file so the caller stores the CDN URL, not raw S3
    const s3FileUrl = `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
    const fileUrl = toCdnUrl(s3FileUrl);

    return { uploadUrl, fileUrl };
}
