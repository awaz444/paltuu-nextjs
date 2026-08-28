import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/providers/me:
 *   get:
 *     summary: The caller's own Vets at Home (Express Vet) provider row, if one exists (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    // The self row is created lazily on first "Assign to Myself" (findOrCreateSelfProvider),
    // so a dispatcher who has never self-assigned simply has no profile yet — that's a
    // clean 200 with provider: null, not a 404.
    const res = await db.query(
      `SELECT * FROM express_vet_providers WHERE linked_user_id = $1`,
      [dispatcherId]
    );
    return NextResponse.json({ provider: res.rows[0] ?? null });
  } catch (error) {
    console.error("express-vet dispatcher/providers/me GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
