import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { clearPostForum, resolveForum, setPostForum } from "@/lib/forumPlacement";
import { getCommunityPost, postPath, speciesByKey } from "@/lib/community";

export const dynamic = "force-dynamic";

/** Forum pages a placement shows on, so a move is visible without waiting out ISR. */
async function forumPaths(postId: number): Promise<string[]> {
  const res = await db.query(
    `SELECT pf.species, b.slug AS breed FROM post_forums pf LEFT JOIN breeds b ON b.breed_id = pf.breed_id WHERE pf.post_id = $1`,
    [postId]
  );
  const row = res.rows[0];
  const species = row ? speciesByKey(row.species) : undefined;
  if (!species) return [];
  return row.breed ? [`/${species.slug}`, `/${species.slug}/${row.breed}`] : [`/${species.slug}`];
}

async function refresh(postId: number, extra: string[]) {
  const paths = new Set<string>(["/home", ...extra, ...(await forumPaths(postId))]);
  const post = await getCommunityPost(postId).catch(() => null);
  if (post) paths.add(postPath(post));
  paths.forEach((p) => revalidatePath(p));
}

async function adminIdOf(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const id = parseInt(String(admin.id), 10);
  return { adminId: Number.isNaN(id) ? null : id };
}

/**
 * PUT /api/v1/admin/social/posts/:id/forum  { species: "cats", breed?: "siamese" | null }
 * Admin override: the post shows in this forum only, whatever pets it tags.
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminIdOf(req);
  if (auth.error) return auth.error;
  const postId = parseInt(params.id, 10);
  if (!Number.isInteger(postId)) return NextResponse.json({ error: "Bad post id" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const placement = await resolveForum(db, { species: body.species, breed: body.breed });
  if (!placement) return NextResponse.json({ error: "Unknown forum" }, { status: 400 });

  const exists = await db.query(`SELECT 1 FROM social_posts WHERE post_id = $1`, [postId]);
  if (!exists.rowCount) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const before = await forumPaths(postId);
  await setPostForum(db, postId, placement, "admin", auth.adminId);
  await db.query(
    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
     VALUES ($1, $2, $3, 'successful')`,
    [auth.adminId, `set_forum:${body.species}${body.breed ? `/${body.breed}` : ""}`, `post:${postId}`]
  );
  await refresh(postId, before);
  return NextResponse.json({ success: true, post_id: postId, forum: placement });
}

/** DELETE /api/v1/admin/social/posts/:id/forum: drop the direct placement; pet and species tags decide again. */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await adminIdOf(req);
  if (auth.error) return auth.error;
  const postId = parseInt(params.id, 10);
  if (!Number.isInteger(postId)) return NextResponse.json({ error: "Bad post id" }, { status: 400 });

  const before = await forumPaths(postId);
  await clearPostForum(db, postId);
  await db.query(
    `INSERT INTO admin_action_logs (admin_id, action_performed, target_entity, status)
     VALUES ($1, 'clear_forum', $2, 'successful')`,
    [auth.adminId, `post:${postId}`]
  );
  await refresh(postId, before);
  return NextResponse.json({ success: true, post_id: postId });
}
