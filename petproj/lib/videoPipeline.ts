import { buildHlsUrl, getMediaConvertJob, hlsOutputExists, resolveThumbnailUrl } from "@/lib/mediaconvert";
import { saveMediaDimensions, toDims, type MediaDims } from "@/lib/mediaDimensions";
import { SocialNotifications } from "@/lib/notifications/notificationTriggers";

/**
 * Marking transcoded videos ready (PALTU-189).
 *
 * Two paths reach here: the EventBridge webhook, when MediaConvert reports a
 * job's state, and reconcileVideoJobs(), which asks MediaConvert directly.
 * Until PALTU-189 the webhook was the only path, it never fired, and every
 * video stayed "processing" with no HLS, so viewers got the raw upload.
 */

type Queryable = { query: (text: string, values?: any[]) => Promise<any> };

/** Videos older than this are marked ready without a "your video is ready" notification. */
const NOTIFY_WITHIN_MS = 24 * 60 * 60 * 1000;

/**
 * Point a finished job's media rows at the HLS output. Returns the number of
 * rows updated. Rows already ready are left alone, so a webhook retry and the
 * reconcile pass can't notify the author twice.
 */
export async function markVideoJobComplete(
    q: Queryable,
    jobId: string,
    outputPrefix: string,
    dims: MediaDims | null,
    opts: { notify: "always" | "recent" | "never" } = { notify: "always" }
): Promise<number> {
    const hlsUrl = buildHlsUrl(outputPrefix);
    const thumbnailUrl = await resolveThumbnailUrl(outputPrefix);

    const result = await q.query(
        `UPDATE social_post_media m
            SET video_status  = 'ready',
                hls_url       = $1,
                thumbnail_url = $2
           FROM social_posts p
          WHERE m.post_id = p.post_id
            AND m.mediaconvert_job_id = $3
            AND m.video_status IS DISTINCT FROM 'ready'
      RETURNING m.media_id, m.post_id, p.user_id, p.created_at`,
        [hlsUrl, thumbnailUrl, jobId]
    );
    if (result.rowCount === 0) return 0;

    await saveMediaDimensions(q, result.rows.map((r: any) => ({ mediaId: r.media_id, dims })));

    const row = result.rows[0];
    const recent = Date.now() - new Date(row.created_at).getTime() < NOTIFY_WITHIN_MS;
    if (opts.notify === "always" || (opts.notify === "recent" && recent)) {
        const authorId = Number(row.user_id);
        SocialNotifications.onVideoReady(authorId, Number(row.post_id), hlsUrl, thumbnailUrl)
            .then(() => console.log(`[video-pipeline] Video ready notification sent to user ${authorId}`))
            .catch((err) => console.error("[video-pipeline] Failed to send notification:", err));
    }
    return result.rowCount;
}

export async function markVideoJobFailed(q: Queryable, jobId: string): Promise<number> {
    const result = await q.query(
        `UPDATE social_post_media SET video_status = 'failed'
          WHERE mediaconvert_job_id = $1 AND video_status IS DISTINCT FROM 'ready'`,
        [jobId]
    );
    return result.rowCount ?? 0;
}

/** The biggest rendition's size, from an EventBridge event's detail (camelCase). */
export function largestDimsFromEvent(detail: any): MediaDims | null {
    return largest(
        (detail?.outputGroupDetails ?? []).flatMap((g: any) =>
            (g?.outputDetails ?? []).map((o: any) => toDims(o?.videoDetails?.widthInPx, o?.videoDetails?.heightInPx))
        )
    );
}

/** The same, from a GetJob response (PascalCase). */
function largestDimsFromJob(job: any): MediaDims | null {
    return largest(
        (job?.OutputGroupDetails ?? []).flatMap((g: any) =>
            (g?.OutputDetails ?? []).map((o: any) => toDims(o?.VideoDetails?.WidthInPx, o?.VideoDetails?.HeightInPx))
        )
    );
}

function largest(all: (MediaDims | null)[]): MediaDims | null {
    let best: MediaDims | null = null;
    for (const d of all) if (d && (!best || d.width * d.height > best.width * best.height)) best = d;
    return best;
}

export type ReconcileResult = {
    checked: number;
    ready: number;
    failed: number;
    stillRunning: number;
    errors: { jobId: string; error: string }[];
};

/**
 * Ask MediaConvert about videos still waiting on a job, and settle the ones
 * that finished. `mediaId` narrows it to one row (the app's status poll);
 * without it, the oldest waiting rows first, up to `limit`.
 */
export async function reconcileVideoJobs(
    q: Queryable,
    opts: { mediaId?: string; limit?: number; dryRun?: boolean } = {}
): Promise<ReconcileResult> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const params: any[] = [limit];
    let where = `media_type = 'video' AND mediaconvert_job_id IS NOT NULL
                 AND (video_status IS NULL OR video_status IN ('pending', 'processing'))`;
    if (opts.mediaId) {
        params.push(opts.mediaId);
        where += ` AND media_id = $2`;
    }
    const rows = await q.query(
        `SELECT mediaconvert_job_id AS job_id, MIN(media_id) AS media_id, MIN(url) AS url
           FROM social_post_media WHERE ${where}
          GROUP BY mediaconvert_job_id
          ORDER BY MIN(media_id)
          LIMIT $1`,
        params
    );

    const out: ReconcileResult = { checked: 0, ready: 0, failed: 0, stillRunning: 0, errors: [] };
    for (const { job_id: jobId, url } of rows.rows as { job_id: string; url: string | null }[]) {
        out.checked++;
        try {
            let job;
            try {
                job = await getMediaConvertJob(jobId);
            } catch (e: any) {
                if (e?.name !== "NotFoundException") throw e;
                // MediaConvert forgets jobs after about 90 days. The output
                // folder is named after the upload, so look for it directly.
                const outputPrefix = outputPrefixFromUploadUrl(url);
                if (outputPrefix && (await hlsOutputExists(outputPrefix))) {
                    if (!opts.dryRun) await markVideoJobComplete(q, jobId, outputPrefix, null, { notify: "never" });
                    out.ready++;
                    continue;
                }
                throw e;
            }
            const status = String(job?.Status ?? "").toUpperCase();
            const outputPrefix = job?.UserMetadata?.outputPrefix;
            if (status === "COMPLETE" && outputPrefix) {
                if (!opts.dryRun) await markVideoJobComplete(q, jobId, outputPrefix, largestDimsFromJob(job), { notify: "recent" });
                out.ready++;
            } else if (status === "ERROR" || status === "CANCELED") {
                if (!opts.dryRun) await markVideoJobFailed(q, jobId);
                out.failed++;
            } else {
                out.stillRunning++;
            }
        } catch (e: any) {
            out.errors.push({ jobId, error: `${e?.name ?? "Error"}: ${e?.message ?? e}` });
        }
    }
    return out;
}

/** "https://cdn/uploads/<uuid>.mp4" → "<uuid>", the folder createMediaConvertJob writes to. */
function outputPrefixFromUploadUrl(url: string | null): string | null {
    const m = url?.match(/\/uploads\/([0-9a-f-]{36})\.[a-z0-9]+(?:\?|$)/i);
    return m ? m[1] : null;
}
