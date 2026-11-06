import pg from "pg";
import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Place existing posts in the forum their text names (PALTU-97), the same rule
// new posts get on create. Run from petproj/ after db/post_forums_migration.ts:
//   npx tsx scripts/backfill_post_forums.ts            # dry run: prints what it would place
//   npx tsx scripts/backfill_post_forums.ts --apply    # writes source='auto' rows
// Posts that already have a placement (admin, author or auto) are skipped.

const apply = process.argv.includes("--apply");
const connectionString = process.env.NEW_DATABASE_URL;
if (!connectionString) throw new Error("NEW_DATABASE_URL environment variable is not set.");
const pool = new pg.Pool({ connectionString, ssl: { rejectUnauthorized: false } });

async function main() {
    // Loaded after dotenv: lib/forumPlacement pulls in db/index, which reads NEW_DATABASE_URL on import.
    const { inferForum, setPostForum } = await import("../lib/forumPlacement");
    const hasTable = (await pool.query(`SELECT to_regclass('public.post_forums') AS t`)).rows[0].t;
    if (apply && !hasTable) throw new Error("post_forums does not exist; run db/post_forums_migration.ts first.");

    const posts = await pool.query(
        `SELECT sp.post_id, sp.content FROM social_posts sp
          WHERE sp.is_deleted = false AND LENGTH(TRIM(COALESCE(sp.content, ''))) > 0
            ${hasTable ? "AND NOT EXISTS (SELECT 1 FROM post_forums pf WHERE pf.post_id = sp.post_id)" : ""}
          ORDER BY sp.post_id`
    );
    const breeds = new Map<number, string>(
        (await pool.query(`SELECT breed_id, name FROM breeds`)).rows.map((r) => [r.breed_id, r.name])
    );

    let placed = 0;
    for (const p of posts.rows) {
        const forum = await inferForum(pool, p.content);
        if (!forum) continue;
        placed++;
        const snippet = String(p.content).replace(/\s+/g, " ").slice(0, 70);
        console.log(`#${p.post_id} -> ${forum.species}/${breeds.get(forum.breedId ?? -1) ?? "-"}  "${snippet}"`);
        if (apply) await setPostForum(pool, p.post_id, forum, "auto", null);
    }
    console.log(`${apply ? "Placed" : "Would place"} ${placed} of ${posts.rowCount} posts.`);
    await pool.end();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
