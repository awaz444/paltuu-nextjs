import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { getVideoUploadPresignedUrl, createMediaConvertJob } from "@/lib/mediaconvert";
import { db } from "@/db/index";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/social/video-upload-url
 *
 * Step 1 of the video upload flow.
 * Returns a presigned S3 PUT URL so the mobile app uploads the raw video
 * directly to paltuu-videos-raw — the server never touches the bytes.
 *
 * Query params:
 *   ?ext=mp4|mov|webm   (default: mp4)
 *   ?post_id=<uuid>     (optional — if the post is already created)
 *
 * Response:
 * {
 *   upload_url: string,   // PUT this URL with the raw video bytes
 *   video_key:  string,   // store this; pass it back in /video-confirm
 *   expires_in: 900       // seconds
 * }
 */
export async function GET(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const ext = (searchParams.get("ext") || "mp4").toLowerCase().replace(/^\./, "");

        const ALLOWED_EXTS = ["mp4", "mov", "webm", "m4v"];
        if (!ALLOWED_EXTS.includes(ext)) {
            return NextResponse.json(
                { error: `Unsupported extension. Use: ${ALLOWED_EXTS.join(", ")}` },
                { status: 400 }
            );
        }

        const { uploadUrl, videoKey } = await getVideoUploadPresignedUrl(ext);

        return NextResponse.json({
            upload_url: uploadUrl,
            video_key: videoKey,
            expires_in: 900,
        });
    } catch (error) {
        console.error("Video upload URL error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

/**
 * POST /api/v1/social/video-upload-url/confirm
 *
 * Step 2 — called by the mobile app AFTER the raw upload to S3 is complete.
 * This kicks off MediaConvert and updates the media row status to "processing".
 *
 * Body:
 * {
 *   video_key: string,    // from Step 1
 *   media_id:  string,    // the social_post_media row to update
 * }
 *
 * Response:
 * { job_id: string, status: "processing" }
 */
export async function POST(req: NextRequest) {
    try {
        const userId = await getUserIdFromRequest(req);
        if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await req.json();
        const { video_key, media_id } = body;

        if (!video_key || !media_id) {
            return NextResponse.json(
                { error: "video_key and media_id are required" },
                { status: 400 }
            );
        }

        // Verify ownership: the media row must belong to a post by this user
        const ownerCheck = await db.query(
            `SELECT m.media_id
             FROM social_post_media m
             JOIN social_posts p ON p.post_id = m.post_id
             WHERE m.media_id = $1 AND p.user_id = $2`,
            [media_id, userId]
        );
        if (ownerCheck.rowCount === 0) {
            return NextResponse.json({ error: "Media not found or unauthorized" }, { status: 403 });
        }

        // Submit MediaConvert job
        const jobId = await createMediaConvertJob(video_key);

        // Update DB: mark as processing
        await db.query(
            `UPDATE social_post_media
             SET video_status = 'processing',
                 mediaconvert_job_id = $1,
                 video_key = $2
             WHERE media_id = $3`,
            [jobId, video_key, media_id]
        );

        return NextResponse.json({ job_id: jobId, status: "processing" });
    } catch (error) {
        console.error("Video confirm error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
