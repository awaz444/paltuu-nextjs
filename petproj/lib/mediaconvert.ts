/**
 * AWS MediaConvert helper for Paltuu video pipeline
 *
 * Flow:
 *   1. Mobile gets a presigned PUT URL for paltuu-videos-raw (this file)
 *   2. Mobile uploads raw video directly to S3
 *   3. S3 event (configured in AWS console) triggers a Lambda OR
 *      the backend calls createMediaConvertJob() directly after receiving confirmation
 *   4. MediaConvert transcodes → HLS segments into paltuu-videos-hls
 *   5. EventBridge fires → POST /api/v1/social/video-webhook updates DB
 */

import {
    MediaConvertClient,
    CreateJobCommand,
    type CreateJobCommandInput,
} from "@aws-sdk/client-mediaconvert";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// ── Config ────────────────────────────────────────────────────────────────────
const REGION               = process.env.AWS_S3_REGION              || "ap-south-1";
const RAW_BUCKET           = process.env.AWS_S3_BUCKET_VIDEOS_RAW   || "paltuu-videos-raw";
const HLS_BUCKET           = process.env.AWS_S3_BUCKET_VIDEOS_HLS   || "paltuu-videos-hls";
const MEDIACONVERT_ENDPOINT = process.env.AWS_MEDIACONVERT_ENDPOINT  || ""; // e.g. https://abcd1234.mediaconvert.ap-south-1.amazonaws.com
const MEDIACONVERT_ROLE    = process.env.AWS_MEDIACONVERT_ROLE_ARN  || ""; // IAM role ARN
const CF_DOMAIN            = process.env.AWS_CLOUDFRONT_VIDEO_DOMAIN || process.env.AWS_CLOUDFRONT_DOMAIN || "";

// ── Singleton clients ─────────────────────────────────────────────────────────
let _mc: MediaConvertClient | null = null;
let _s3raw: S3Client | null = null;

function getMC(): MediaConvertClient {
    if (_mc) return _mc;
    _mc = new MediaConvertClient({
        region: REGION,
        endpoint: MEDIACONVERT_ENDPOINT, // MediaConvert requires account-specific endpoint
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    return _mc;
}

function getRawS3(): S3Client {
    if (_s3raw) return _s3raw;
    _s3raw = new S3Client({
        region: REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
    });
    return _s3raw;
}

// ── Presigned upload URL for raw video ────────────────────────────────────────

/**
 * Returns a presigned PUT URL for the mobile app to upload a raw video directly
 * to paltuu-videos-raw/uploads/{videoKey}.mp4
 *
 * Expires in 15 minutes (900 seconds) — enough for large files on mobile.
 */
export async function getVideoUploadPresignedUrl(ext: string = "mp4"): Promise<{
    uploadUrl: string;
    videoKey: string;
    rawUrl: string;
}> {
    const videoKey = `uploads/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
        Bucket: RAW_BUCKET,
        Key: videoKey,
        ContentType: `video/${ext === "mov" ? "quicktime" : ext}`,
    });

    const uploadUrl = await getSignedUrl(getRawS3(), command, { expiresIn: 900 });
    const rawUrl    = `https://${RAW_BUCKET}.s3.${REGION}.amazonaws.com/${videoKey}`;

    return { uploadUrl, videoKey, rawUrl };
}

// ── MediaConvert job ──────────────────────────────────────────────────────────

/**
 * Submit a MediaConvert job to transcode a raw S3 video into HLS.
 *
 * Outputs (written to paltuu-videos-hls/{videoKey}/):
 *   - 360p  800kbps
 *   - 720p  2.5Mbps
 *   - 1080p 5Mbps
 *   - thumbnail.jpg at 1s, 5s, 10s
 *
 * Returns the MediaConvert job ID so you can store it in the DB.
 */
export async function createMediaConvertJob(videoKey: string): Promise<string> {
    if (!MEDIACONVERT_ENDPOINT || !MEDIACONVERT_ROLE) {
        throw new Error(
            "AWS_MEDIACONVERT_ENDPOINT and AWS_MEDIACONVERT_ROLE_ARN must be set in .env"
        );
    }

    // Strip the leading folder prefix from the key for the output path
    const outputPrefix = videoKey.replace(/^uploads\//, "").replace(/\.[^.]+$/, ""); // e.g. abc-uuid

    const input: CreateJobCommandInput = {
        Role: MEDIACONVERT_ROLE,
        Settings: {
            Inputs: [
                {
                    FileInput: `s3://${RAW_BUCKET}/${videoKey}`,
                    AudioSelectors: { "Audio Selector 1": { DefaultSelection: "DEFAULT" } },
                    VideoSelector: {},
                    TimecodeSource: "ZEROBASED",
                },
            ],
            OutputGroups: [
                // ── HLS Adaptive Bitrate Group ──────────────────────────────
                {
                    Name: "HLS",
                    OutputGroupSettings: {
                        Type: "HLS_GROUP_SETTINGS",
                        HlsGroupSettings: {
                            SegmentLength: 6,
                            MinSegmentLength: 0,
                            Destination: `s3://${HLS_BUCKET}/${outputPrefix}/hls/`,
                        },
                    },
                    Outputs: [
                        // 360p
                        {
                            NameModifier: "_360p",
                            VideoDescription: {
                                Width: 640,
                                Height: 360,
                                CodecSettings: {
                                    Codec: "H_264",
                                    H264Settings: {
                                        Bitrate: 800000,
                                        RateControlMode: "CBR",
                                        CodecProfile: "MAIN",
                                        CodecLevel: "AUTO",
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: "AAC",
                                        AacSettings: { Bitrate: 96000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                                    },
                                },
                            ],
                            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
                        },
                        // 720p
                        {
                            NameModifier: "_720p",
                            VideoDescription: {
                                Width: 1280,
                                Height: 720,
                                CodecSettings: {
                                    Codec: "H_264",
                                    H264Settings: {
                                        Bitrate: 2500000,
                                        RateControlMode: "CBR",
                                        CodecProfile: "MAIN",
                                        CodecLevel: "AUTO",
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: "AAC",
                                        AacSettings: { Bitrate: 128000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                                    },
                                },
                            ],
                            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
                        },
                        // 1080p
                        {
                            NameModifier: "_1080p",
                            VideoDescription: {
                                Width: 1920,
                                Height: 1080,
                                CodecSettings: {
                                    Codec: "H_264",
                                    H264Settings: {
                                        Bitrate: 5000000,
                                        RateControlMode: "CBR",
                                        CodecProfile: "HIGH",
                                        CodecLevel: "AUTO",
                                    },
                                },
                            },
                            AudioDescriptions: [
                                {
                                    CodecSettings: {
                                        Codec: "AAC",
                                        AacSettings: { Bitrate: 192000, CodingMode: "CODING_MODE_2_0", SampleRate: 48000 },
                                    },
                                },
                            ],
                            ContainerSettings: { Container: "M3U8", M3u8Settings: {} },
                        },
                    ],
                },
                // ── Thumbnail Group ─────────────────────────────────────────
                {
                    Name: "Thumbnails",
                    OutputGroupSettings: {
                        Type: "FILE_GROUP_SETTINGS",
                        FileGroupSettings: {
                            Destination: `s3://${HLS_BUCKET}/${outputPrefix}/thumbs/`,
                        },
                    },
                    Outputs: [
                        {
                            NameModifier: "_thumb",
                            VideoDescription: {
                                Width: 720,
                                Height: 404,
                                CodecSettings: {
                                    Codec: "FRAME_CAPTURE",
                                    FrameCaptureSettings: {
                                        FramerateNumerator: 1,
                                        FramerateDenominator: 10, // 1 frame every 10 seconds
                                        MaxCaptures: 3,
                                        Quality: 80,
                                    },
                                },
                            },
                            ContainerSettings: { Container: "RAW" },
                        },
                    ],
                },
            ],
        },
        // Tag the job with the videoKey so the EventBridge webhook can look it up
        UserMetadata: { videoKey, outputPrefix },
    };

    const res = await getMC().send(new CreateJobCommand(input));
    const jobId = res.Job?.Id;
    if (!jobId) throw new Error("MediaConvert did not return a job ID");

    return jobId;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Build the CloudFront HLS manifest URL from the outputPrefix.
 * e.g. https://dXXX.cloudfront.net/{outputPrefix}/hls/{outputPrefix}.m3u8
 */
export function buildHlsUrl(outputPrefix: string): string {
    const base = CF_DOMAIN
        ? `https://${CF_DOMAIN}`
        : `https://${HLS_BUCKET}.s3.${REGION}.amazonaws.com`;
    return `${base}/${outputPrefix}/hls/${outputPrefix}.m3u8`;
}

/**
 * Build the thumbnail URL (first captured frame).
 */
export function buildThumbnailUrl(outputPrefix: string): string {
    const base = CF_DOMAIN
        ? `https://${CF_DOMAIN}`
        : `https://${HLS_BUCKET}.s3.${REGION}.amazonaws.com`;
    return `${base}/${outputPrefix}/thumbs/${outputPrefix}_thumb.0000001.jpg`;
}
