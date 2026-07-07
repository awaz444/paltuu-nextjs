/**
 * AWS MediaConvert helper for Paltuu video pipeline
 *
 * Flow:
 *   1. Mobile gets a presigned PUT URL for paltuu-videos-raw (this file)
 *   2. Mobile uploads raw video directly to S3
 *   3. Backend calls createMediaConvertJob() after receiving upload confirmation
 *   4. MediaConvert transcodes → HLS segments into paltuu-videos-hls
 *   5. EventBridge fires → POST /api/v1/social/video-webhook updates DB
 */

import {
    MediaConvertClient,
    CreateJobCommand,
    DescribeEndpointsCommand,
    type CreateJobCommandInput,
} from "@aws-sdk/client-mediaconvert";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// ── Config ────────────────────────────────────────────────────────────────────
const REGION               = process.env.AWS_S3_REGION              || "ap-south-1";
const RAW_BUCKET           = process.env.AWS_S3_BUCKET_VIDEOS_RAW   || "paltuu-videos-raw";
const HLS_BUCKET           = process.env.AWS_S3_BUCKET_VIDEOS_HLS   || "paltuu-videos-hls";
const MEDIACONVERT_ROLE    = process.env.AWS_MEDIACONVERT_ROLE_ARN  || ""; // IAM role ARN
const CF_DOMAIN            = process.env.AWS_CLOUDFRONT_VIDEO_DOMAIN || process.env.AWS_CLOUDFRONT_DOMAIN || "";
const CF_RAW_DOMAIN        = process.env.AWS_CLOUDFRONT_RAW_DOMAIN  || "";
const MEDIACONVERT_QUEUE   = process.env.AWS_MEDIACONVERT_QUEUE     || "";


// The configured endpoint from .env — may be the generic regional URL or the
// account-specific one. We auto-discover the real one on first use.
const CONFIGURED_ENDPOINT  = process.env.AWS_MEDIACONVERT_ENDPOINT  || "";

// ── Singleton clients ─────────────────────────────────────────────────────────
let _mc: MediaConvertClient | null = null;
let _s3raw: S3Client | null = null;

// Cache of the resolved, account-specific MediaConvert endpoint.
// MediaConvert requires the account-specific endpoint for job operations.
let _resolvedEndpoint: string | null = null;

const CREDENTIALS = {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
};

/**
 * Resolves the account-specific MediaConvert endpoint.
 * If CONFIGURED_ENDPOINT looks like the generic regional URL, we call
 * DescribeEndpoints to discover the real one. Result is cached for the
 * lifetime of the process.
 */
async function resolveEndpoint(): Promise<string> {
    if (_resolvedEndpoint) return _resolvedEndpoint;

    // If the configured endpoint already looks account-specific (contains a
    // hex subdomain like "abcdef123456.mediaconvert.region.amazonaws.com"),
    // use it directly.
    const isAccountSpecific = CONFIGURED_ENDPOINT &&
        /^https:\/\/[a-z0-9]+\.mediaconvert\.[a-z0-9-]+\.amazonaws\.com/.test(CONFIGURED_ENDPOINT) &&
        !CONFIGURED_ENDPOINT.startsWith("https://mediaconvert.");

    if (isAccountSpecific) {
        _resolvedEndpoint = CONFIGURED_ENDPOINT;
        return _resolvedEndpoint;
    }

    // Otherwise, auto-discover via DescribeEndpoints using the generic endpoint.
    console.log("[MediaConvert] Auto-discovering account-specific endpoint...");
    try {
        const discoveryClient = new MediaConvertClient({
            region: REGION,
            // Use configured endpoint for the describe call (generic URL is OK here)
            ...(CONFIGURED_ENDPOINT ? { endpoint: CONFIGURED_ENDPOINT } : {}),
            credentials: CREDENTIALS,
        });

        const res = await discoveryClient.send(new DescribeEndpointsCommand({ Mode: "DEFAULT" }));
        const discovered = res.Endpoints?.[0]?.Url;

        if (discovered && discovered !== CONFIGURED_ENDPOINT) {
            // Discovered a real account-specific endpoint
            console.log("[MediaConvert] Resolved endpoint:", discovered);
            _resolvedEndpoint = discovered;
        } else if (CONFIGURED_ENDPOINT) {
            // DescribeEndpoints returned the same generic URL — AWS may be treating
            // the regional URL as the account endpoint for this account.
            console.warn("[MediaConvert] DescribeEndpoints returned generic URL — using it as-is:", CONFIGURED_ENDPOINT);
            _resolvedEndpoint = CONFIGURED_ENDPOINT;
        } else {
            throw new Error(
                "Could not resolve MediaConvert endpoint. Set AWS_MEDIACONVERT_ENDPOINT in .env " +
                "to your account-specific endpoint (found in AWS Console → MediaConvert → Account)."
            );
        }
    } catch (err) {
        console.error("[MediaConvert] Endpoint discovery failed:", err);
        if (CONFIGURED_ENDPOINT) {
            console.warn("[MediaConvert] Falling back to configured endpoint:", CONFIGURED_ENDPOINT);
            _resolvedEndpoint = CONFIGURED_ENDPOINT;
        } else {
            throw err;
        }
    }

    return _resolvedEndpoint!;
}

async function getMC(): Promise<MediaConvertClient> {
    if (_mc) return _mc;
    const endpoint = await resolveEndpoint();
    _mc = new MediaConvertClient({
        region: REGION,
        endpoint,
        credentials: CREDENTIALS,
    });
    return _mc;
}

function getRawS3(): S3Client {
    if (_s3raw) return _s3raw;
    _s3raw = new S3Client({
        region: REGION,
        credentials: CREDENTIALS,
    });
    return _s3raw;
}

// ── Presigned upload URL for raw video ────────────────────────────────────────

/**
 * Returns a presigned PUT URL for the mobile app to upload a raw video directly
 * to paltuu-videos-raw/uploads/{videoKey}
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
    const rawUrl    = CF_RAW_DOMAIN
        ? `https://${CF_RAW_DOMAIN}/${videoKey}`
        : `https://${RAW_BUCKET}.s3.${REGION}.amazonaws.com/${videoKey}`;

    return { uploadUrl, videoKey, rawUrl };

}

// ── MediaConvert job ──────────────────────────────────────────────────────────

/**
 * Submit a MediaConvert job to transcode a raw S3 video into HLS.
 *
 * Outputs (written to paltuu-videos-hls/{outputPrefix}/):
 *   - hls/hls.m3u8          ← master playlist
 *   - hls/hls_360p*.ts      ← 360p 800kbps segments
 *   - hls/hls_720p*.ts      ← 720p 2.5Mbps segments
 *   - hls/hls_1080p*.ts     ← 1080p 5Mbps segments
 *   - thumbs/{prefix}_thumb.0000001.jpg  ← first thumbnail
 *
 * Returns the MediaConvert job ID so you can store it in the DB.
 */
export async function createMediaConvertJob(videoKey: string): Promise<string> {
    if (!MEDIACONVERT_ROLE) {
        throw new Error("AWS_MEDIACONVERT_ROLE_ARN must be set in .env");
    }

    // Strip the leading folder prefix from the key for the output path
    // e.g. "uploads/abc-uuid.mp4" → "abc-uuid"
    const outputPrefix = videoKey
        .replace(/^uploads\//, "")
        .replace(/\.[^.]+$/, "");

    const input: CreateJobCommandInput = {
        Role: MEDIACONVERT_ROLE,
        ...(MEDIACONVERT_QUEUE ? { Queue: MEDIACONVERT_QUEUE } : {}),
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
                            // MediaConvert names the master playlist after the last segment
                            // of the Destination path → "hls" → master = hls.m3u8
                            Destination: `s3://${HLS_BUCKET}/${outputPrefix}/hls/hls`,
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
                                        MaxBitrate: 1000000,
                                        RateControlMode: "QVBR",
                                        QvbrSettings: {
                                            QvbrQualityLevel: 7,
                                        },
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
                                        MaxBitrate: 3000000,
                                        RateControlMode: "QVBR",
                                        QvbrSettings: {
                                            QvbrQualityLevel: 7,
                                        },
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
                                        MaxBitrate: 6000000,
                                        RateControlMode: "QVBR",
                                        QvbrSettings: {
                                            QvbrQualityLevel: 7,
                                        },
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
                            // MediaConvert appends NameModifier + frame index to this prefix.
                            // Result: {outputPrefix}/thumbs/{outputPrefix}_thumb.0000001.jpg
                            Destination: `s3://${HLS_BUCKET}/${outputPrefix}/thumbs/${outputPrefix}`,
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
                                        FramerateDenominator: 5, // 1 frame every 5 seconds
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

    const mc = await getMC();
    const res = await mc.send(new CreateJobCommand(input));
    const jobId = res.Job?.Id;
    if (!jobId) throw new Error("MediaConvert did not return a job ID");

    console.log(`[MediaConvert] Job submitted: ${jobId} for key: ${videoKey}`);
    return jobId;
}

// ── URL helpers ───────────────────────────────────────────────────────────────

/**
 * Build the CloudFront (or S3) HLS master playlist URL.
 *
 * AWS MediaConvert names the master playlist based on the Destination prefix:
 *   Destination: s3://bucket/{outputPrefix}/hls/hls
 *   → master playlist: hls.m3u8
 *   → full path: {outputPrefix}/hls/hls.m3u8
 */
export function buildHlsUrl(outputPrefix: string): string {
    const base = CF_DOMAIN
        ? `https://${CF_DOMAIN}`
        : `https://${HLS_BUCKET}.s3.${REGION}.amazonaws.com`;
    // The master playlist is named after the Destination filename segment: "hls"
    return `${base}/${outputPrefix}/hls/hls.m3u8`;
}

/**
 * Build the thumbnail URL (first captured frame).
 *
 * MediaConvert FRAME_CAPTURE produces files named:
 *   {Destination}{NameModifier}.{frame_number_zero_padded}.jpg
 *   e.g. {outputPrefix}/thumbs/{outputPrefix}_thumb.0000001.jpg
 */
export function buildThumbnailUrl(outputPrefix: string): string {
    const base = CF_DOMAIN
        ? `https://${CF_DOMAIN}`
        : `https://${HLS_BUCKET}.s3.${REGION}.amazonaws.com`;
    return `${base}/${outputPrefix}/thumbs/${outputPrefix}_thumb.0000001.jpg`;
}
