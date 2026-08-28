import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { ensureSelfProvider } from "@/lib/expressVet/providers";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/providers/me:
 *   get:
 *     summary: The caller's own Vets at Home (Express Vet) provider row, if one exists (V1)
 *     tags: [v1 Express Vet]
 *   post:
 *     summary: Get-or-create the caller's own Vets at Home provider row so it can be edited (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    // A dispatcher who has never opened "My vet profile" or self-assigned simply has no
    // row yet — a clean 200 with provider: null, not a 404.
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

export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    // The JWT (mobile Bearer tokens especially) doesn't reliably carry `name`, and this
    // is written once — read it fresh rather than trusting the token.
    const userRes = await db.query(`SELECT name FROM users WHERE user_id = $1`, [dispatcherId]);
    const dispatcherName = userRes.rows[0]?.name || dispatcher.name || "Dispatcher";
    const provider = await ensureSelfProvider(dispatcherId, dispatcherName);
    return NextResponse.json({ provider });
  } catch (error) {
    console.error("express-vet dispatcher/providers/me POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
