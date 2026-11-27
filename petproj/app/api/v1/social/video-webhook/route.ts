import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { largestDimsFromEvent, markVideoJobComplete, markVideoJobFailed } from "@/lib/videoPipeline";

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
 *   Target:        API Gateway HTTP endpoint pointing at this URL.
 *
 * Authentication options (pick ONE):
 *   A) API Gateway adds `x-paltuu-webhook-secret` header in the integration
 *      request (recommended for production).
 *   B) Set VIDEO_WEBHOOK_SECRET="" in .env to disable the secret check
 *      while you are still setting up EventBridge (NOT for production).
 *
 * The handler validates that the body looks like a real EventBridge/MediaConvert
 * event regardless of auth method, so random HTTP probes are rejected.
 */
export async function POST(req: NextRequest) {
    // ── Authenticate the webhook ──────────────────────────────────────────────
    // Only enforce the shared-secret check when VIDEO_WEBHOOK_SECRET is non-empty.
    // During initial EventBridge setup you can temporarily clear the env var to
    // verify connectivity, then re-enable it once the header is injected by API Gateway.
    const expectedSecret = process.env.VIDEO_WEBHOOK_SECRET;
    if (expectedSecret) {
        const incoming = req.headers.get("x-paltuu-webhook-secret");
        if (incoming !== expectedSecret) {
            console.warn("[video-webhook] Rejected: missing or wrong x-paltuu-webhook-secret header");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
    }

    let rawBody: any;
    try {
        rawBody = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ── Validate it looks like an EventBridge MediaConvert event ─────────────
    // EventBridge wraps the MediaConvert event in a standard envelope.
    // Accept both the full EB envelope and a raw MediaConvert detail object.
    const isEventBridgeEnvelope =
        rawBody?.source === "aws.mediaconvert" ||
        rawBody?.["detail-type"] === "MediaConvert Job State Change";

    if (!isEventBridgeEnvelope && !rawBody?.detail && !rawBody?.jobId) {
        console.warn("[video-webhook] Rejected: body does not look like a MediaConvert event");
        return NextResponse.json({ error: "Invalid event structure" }, { status: 400 });
    }

    try {
        // EventBridge puts the job state inside `detail`; direct calls may omit the wrapper
        const detail       = rawBody.detail ?? rawBody;
        const status       = String(detail.status   ?? "").toUpperCase();  // "COMPLETE" | "ERROR"
        const jobId        = String(detail.jobId    ?? "").trim();
        const userMeta     = detail.userMetadata as Record<string, string> | undefined;
        const outputPrefix = userMeta?.outputPrefix;

        console.log(`[video-webhook] Received — jobId: ${jobId}, status: ${status}, outputPrefix: ${outputPrefix}`);

        if (!jobId) {
            return NextResponse.json({ error: "Missing jobId in event detail" }, { status: 400 });
        }

        if (status === "COMPLETE" && outputPrefix) {
            // Shared with the reconcile pass (PALTU-189). Sizes from the
            // biggest rendition, which is what viewers see (PALTU-159).
            const updated = await markVideoJobComplete(db, jobId, outputPrefix, largestDimsFromEvent(detail));
            if (updated === 0) {
                // Unknown job, or already marked ready by the reconcile pass.
                console.warn(`[video-webhook] No waiting media row for jobId: ${jobId}`);
            } else {
                console.log(`[video-webhook] ✅ Job ${jobId} COMPLETE`);
            }

        } else if (status === "ERROR") {
            const errorMessage = detail.errorMessage ?? detail.errorCode ?? "Unknown error";
            await markVideoJobFailed(db, jobId);
            console.error(`[video-webhook] ❌ Job ${jobId} FAILED:`, errorMessage);

        } else {
            // Intermediate states like SUBMITTED, PROGRESSING — log and ack
            console.log(`[video-webhook] Ignored intermediate state: ${status} for job ${jobId}`);
        }

        return NextResponse.json({ ok: true });

    } catch (error) {
        console.error("[video-webhook] Error processing event:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
