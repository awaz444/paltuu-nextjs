import sharp from "sharp";

/**
 * Pixel size of a social post's photo/video, stored on social_post_media
 * (PALTU-159) so feed cards can draw each frame in the media's own shape.
 * Server only (sharp); the framing math lives in lib/mediaFrame.ts.
 */
export type MediaDims = { width: number; height: number };

const MAX_SIDE = 20_000;
// Feed photos are ≤1200px JPEGs and posters smaller still; Klipy GIFs run to a
// few MB. Anything bigger isn't worth pulling into memory just for a header.
const MAX_PROBE_BYTES = 15 * 1024 * 1024;

type Queryable = { query: (text: string, values?: any[]) => Promise<any> };

const toNumber = (v: unknown) =>
    typeof v === "number" || (typeof v === "string" && v.trim() !== "") ? Number(v) : NaN;

/** A positive width/height pair from untrusted input (a client payload, an AWS event, a JSON column), or null. */
export function toDims(width: unknown, height: unknown): MediaDims | null {
    const w = Math.round(toNumber(width));
    const h = Math.round(toNumber(height));
    if (!Number.isFinite(w) || !Number.isFinite(h)) return null;
    if (w < 1 || h < 1 || w > MAX_SIDE || h > MAX_SIDE) return null;
    return { width: w, height: h };
}

let warnedMissingColumns = false;

/**
 * Best effort: record width/height on media rows. Never throws. The size only
 * decides how a frame is drawn, so a failure here (most likely the migration
 * hasn't been run yet) must never fail the request that called it.
 */
export async function saveMediaDimensions(
    q: Queryable,
    rows: { mediaId: string | number; dims: MediaDims | null }[]
): Promise<void> {
    const sized = rows.filter((r): r is { mediaId: string | number; dims: MediaDims } => r.dims !== null);
    if (sized.length === 0) return;
    try {
        await q.query(
            `UPDATE social_post_media m
                SET width = d.w, height = d.h
               FROM unnest($1::bigint[], $2::int[], $3::int[]) AS d(id, w, h)
              WHERE m.media_id = d.id`,
            [sized.map((r) => String(r.mediaId)), sized.map((r) => r.dims.width), sized.map((r) => r.dims.height)]
        );
    } catch (e: any) {
        if (e?.code === "42703") {
            // undefined_column: say it once per process, not on every post.
            if (!warnedMissingColumns) {
                warnedMissingColumns = true;
                console.warn("[media-dims] social_post_media.width/height missing; run migrations/add_dimensions_to_social_post_media.sql");
            }
            return;
        }
        console.error("[media-dims] failed to save dimensions", e);
    }
}

/**
 * Measure a remote image (JPEG, PNG, WebP or GIF) by downloading it and
 * reading its header. Returns the size as displayed, i.e. with EXIF rotation
 * applied, or null if it can't be fetched or read in time.
 */
export async function probeImageDimensions(url: string | null | undefined, timeoutMs = 4000): Promise<MediaDims | null> {
    if (!url || !/^https:\/\//i.test(url)) return null;
    try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
        if (!res.ok) return null;
        if (Number(res.headers.get("content-length") || 0) > MAX_PROBE_BYTES) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length > MAX_PROBE_BYTES) return null;
        const meta = await sharp(buf).metadata();
        // Animated GIF/WebP: one frame's height, not the whole strip.
        const width = meta.width;
        const height = meta.pageHeight || meta.height;
        // EXIF orientations 5-8 are quarter turns; browsers display them swapped.
        return (meta.orientation ?? 1) >= 5 ? toDims(height, width) : toDims(width, height);
    } catch {
        return null;
    }
}
