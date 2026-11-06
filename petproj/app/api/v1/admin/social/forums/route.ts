import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "@/app/api/v1/admin/adminAuth";
import { listForumOptions } from "@/lib/forumPlacement";

export const dynamic = "force-dynamic";

/** GET /api/v1/admin/social/forums: every forum a post can be placed in, grouped by species. */
export async function GET(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return NextResponse.json({ forums: await listForumOptions(db) });
}
