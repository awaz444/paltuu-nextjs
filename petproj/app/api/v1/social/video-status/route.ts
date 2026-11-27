import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";
import { reconcileVideoJobs } from "@/lib/videoPipeline";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/video-status?media_id=<uuid>
 *
 * Polls the processing status of a video post media item.
 * Called by the mobile app after upload to show a "processing..." state.
 *
 * Response:
 * {
 *   media_id: string,
 *   video_status: "pending" | "processing" | "ready" | "failed",
 *   hls_url: string | null,
 *   thumbnail_url: string | null,
 * }
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const mediaId = searchParams.get("media_id");

        if (!mediaId) {
            return NextResponse.json({ error: "media_id is required" }, { status: 400 });
        }

        const read = () => db.query(
            `SELECT media_id, video_status, hls_url, thumbnail_url, url, mediaconvert_job_id
             FROM social_post_media
             WHERE media_id = $1`,
            [mediaId]
        );
        let result = await read();

        // Still waiting: ask MediaConvert directly rather than relying only on
        // the EventBridge webhook, which may never arrive (PALTU-189).
        const waiting = result.rows[0];
        if (waiting?.mediaconvert_job_id && (!waiting.video_status || waiting.video_status === "pending" || waiting.video_status === "processing")) {
            try {
                const r = await reconcileVideoJobs(db, { mediaId: String(waiting.media_id) });
                if (r.ready || r.failed) result = await read();
            } catch (e) {
                console.warn("[video-status] reconcile failed, returning stored status:", e);
            }
        }

        if (result.rowCount === 0) {
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }

        const row = result.rows[0];
        return NextResponse.json({
            media_id:      row.media_id,
            video_status:  row.video_status || "ready",
            hls_url:       row.hls_url || row.url, // fallback to raw URL while processing
            thumbnail_url: row.thumbnail_url,
        });
    } catch (error) {
        console.error("Video status error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
