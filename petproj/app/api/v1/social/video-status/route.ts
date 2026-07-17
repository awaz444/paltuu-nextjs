import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { getUserIdFromRequest } from "@/utils/authServer";

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

        const result = await db.query(
            `SELECT media_id, video_status, hls_url, thumbnail_url, url
             FROM social_post_media
             WHERE media_id = $1`,
            [mediaId]
        );

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
