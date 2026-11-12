import pg from "pg";
import * as dotenv from "dotenv";
import path from "path";
import { probeImageDimensions, saveMediaDimensions, type MediaDims } from "../lib/mediaDimensions";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Measure social_post_media rows that have no width/height yet, so their feed
// frames take the media's own shape (PALTU-159). Run from petproj/ after
// migrations/add_dimensions_to_social_post_media.sql:
//   npx tsx scripts/backfill_media_dimensions.ts                # dry run: measures, writes nothing
//   npx tsx scripts/backfill_media_dimensions.ts --apply        # writes width/height
//   npx tsx scripts/backfill_media_dimensions.ts --limit 50     # newest 50 rows only
// Safe to re-run: rows that already have a size are skipped, and bot posts
// (persona-engine) still arrive without one. Photos are measured from the
// file, GIFs from their preview, videos from their thumbnail: the still the
// feed shows, which has the same shape as the stream the app plays.

const apply = process.argv.includes("--apply");
const limitAt = process.argv.indexOf("--limit");
const limit = limitAt > -1 ? Math.max(1, Math.floor(Number(process.argv[limitAt + 1]))) : null;
if (limitAt > -1 && !Number.isFinite(limit)) throw new Error("--limit needs a number");
const CONCURRENCY = 8;

const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) throw new Error("NEW_DATABASE_URL environment variable is not set.");
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

type Row = { media_id: string; media_type: string; url: string | null; thumbnail_url: string | null };

/** Where to read each kind of media's size from, best first. */
function sources(r: Row): (string | null)[] {
    if (r.media_type === "video") return [r.thumbnail_url]; // sharp can't read video; the still matches it
    if (r.media_type === "gif") return [r.thumbnail_url, r.url];
    return [r.url, r.thumbnail_url];
}

const shape = (d: MediaDims) => {
    const ratio = d.width / d.height;
    if (ratio < 0.8) return "taller than 4:5 (cropped to 4:5)";
    if (ratio > 16 / 9 + 0.01) return "wider than 16:9 (cropped to 16:9)";
    if (Math.abs(ratio - 16 / 9) <= 0.01) return "16:9";
    if (ratio < 1) return "portrait";
    return ratio === 1 ? "square" : "landscape";
};

async function main() {
    const hasColumns =
        (await pool.query(
            `SELECT COUNT(*)::int AS n FROM information_schema.columns
              WHERE table_name = 'social_post_media' AND column_name IN ('width', 'height')`
        )).rows[0].n === 2;
    if (apply && !hasColumns) {
        throw new Error("social_post_media.width/height don't exist; run migrations/add_dimensions_to_social_post_media.sql first.");
    }
    if (!hasColumns) console.log("(width/height columns not there yet: measuring every row, nothing will be written)\n");

    const rows: Row[] = (
        await pool.query(
            `SELECT media_id::text, media_type, url, thumbnail_url
               FROM social_post_media
              WHERE url IS NOT NULL ${hasColumns ? "AND (width IS NULL OR height IS NULL)" : ""}
              ORDER BY media_id DESC
              ${limit ? `LIMIT ${limit}` : ""}`
        )
    ).rows;
    console.log(`${rows.length} media rows without a size.`);

    const tally = new Map<string, number>();
    const failed: Row[] = [];
    let measured = 0;
    let next = 0;

    async function worker() {
        while (next < rows.length) {
            const r = rows[next++];
            let dims: MediaDims | null = null;
            for (const url of sources(r)) {
                dims = await probeImageDimensions(url, 10_000);
                if (dims) break;
            }
            if (!dims) {
                failed.push(r);
                continue;
            }
            measured++;
            const key = `${r.media_type}: ${shape(dims)}`;
            tally.set(key, (tally.get(key) ?? 0) + 1);
            if (apply) await saveMediaDimensions(pool, [{ mediaId: r.media_id, dims }]);
            if (measured % 100 === 0) console.log(`  …${measured} measured`);
        }
    }
    await Promise.all(Array.from({ length: CONCURRENCY }, worker));

    console.log(`\n${apply ? "Saved" : "Would save"} ${measured} sizes:`);
    for (const [key, n] of [...tally.entries()].sort()) console.log(`  ${key.padEnd(46)} ${n}`);
    if (tally.get("video: 16:9")) {
        console.log("  (16:9 videos are mostly ones transcoded before PALTU-159, so their stream has a 16:9 frame baked in)");
    }
    if (failed.length) {
        console.log(`\nCould not measure ${failed.length} (missing file, not an image, or timed out):`);
        for (const r of failed.slice(0, 50)) console.log(`  #${r.media_id} ${r.media_type} ${sources(r).find(Boolean) ?? "(no url)"}`);
        if (failed.length > 50) console.log(`  …and ${failed.length - 50} more`);
    }
    await pool.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
