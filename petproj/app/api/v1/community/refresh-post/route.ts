import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getUserIdFromRequest } from "@/utils/authServer";
import { rateLimit, LIMITS } from "@/lib/rateLimit";
import { getCommunityPost, postPath } from "@/lib/community";

export const dynamic = "force-dynamic";

/**
 * POST /api/v1/community/refresh-post  { postId }
 * Rebuilds a post's web page right after someone replies from the website, so
 * the reply shows without waiting out the page's ISR window. Only the post's
 * own canonical path is rebuilt, and only for a signed-in user.
 */
export async function POST(req: NextRequest) {
    const limited = await rateLimit(req, LIMITS.COMMENT);
    if (limited) return limited;
    if (!(await getUserIdFromRequest(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { postId } = await req.json().catch(() => ({}));
    const id = Number(postId);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ error: "Bad postId" }, { status: 400 });

    const post = await getCommunityPost(id);
    if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
    revalidatePath(postPath(post));
    return NextResponse.json({ ok: true });
}
