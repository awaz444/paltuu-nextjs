import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { buildHlsUrl, buildThumbnailUrl } from "@/lib/mediaconvert";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/social/video-webhook
 *
 * Receives EventBridge notifications from MediaConvert when a job
 * COMPLETES or fails.
 *
 * AWS EventBridge rule setup (in your AWS console):
 *   Source:        aws.mediaconvert
 *   Detail-type:   MediaConvert Job State Change
 *   States:        COMPLETE, ERROR
 *   Target:        This API URL (via API Gateway → ALB or directly if using App Runner / EC2)
 *
 * Alternatively, use an API Gateway HTTP integration pointing to this route.
 *
 * The webhook is protected by a shared secret in the x-paltuu-webhook-secret header.
 */
export async function POST(req: NextRequest) {
    // ── Authenticate the webhook ──────────────────────────────────────────────
    const secret = req.headers.get("x-paltuu-webhook-secret");
    if (secret !== process.env.VIDEO_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();

        // EventBridge wraps the MediaConvert event in a standard envelope
        const detail    = body.detail || body; // handle both raw and EB wrapped
        const status    = detail.status as string;           // "COMPLETE" | "ERROR"
        const jobId     = detail.jobId  as string;
        const userMeta  = detail.userMetadata as Record<string, string> | undefined;
        const outputPrefix = userMeta?.outputPrefix;

        if (!jobId) {
            return NextResponse.json({ error: "Missing jobId" }, { status: 400 });
        }

        if (status === "COMPLETE" && outputPrefix) {
            const hlsUrl       = buildHlsUrl(outputPrefix);
            const thumbnailUrl = buildThumbnailUrl(outputPrefix);

            await db.query(
                `UPDATE social_post_media
                 SET video_status  = 'ready',
                     hls_url       = $1,
                     thumbnail_url = $2
                 WHERE mediaconvert_job_id = $3`,
                [hlsUrl, thumbnailUrl, jobId]
            );

            console.log(`[video-webhook] Job ${jobId} COMPLETE → ${hlsUrl}`);

            // Optional: send push notification to post author
            // You could fire a Firebase notification here if needed.

        } else if (status === "ERROR") {
            await db.query(
                `UPDATE social_post_media
                 SET video_status = 'failed'
                 WHERE mediaconvert_job_id = $1`,
                [jobId]
            );

            console.error(`[video-webhook] Job ${jobId} FAILED`, detail.errorMessage);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("[video-webhook] Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
