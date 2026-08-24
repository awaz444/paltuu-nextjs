import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

const MUTE_MINUTES = 30;

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/mute:
 *   get:
 *     summary: The current dispatcher's mute status for Vets at Home (Express Vet) alerts (V1)
 *     tags: [v1 Express Vet]
 *   post:
 *     summary: Mute this dispatcher's Vets at Home (Express Vet) alerts for 30 minutes (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);
    const result = await db.query(`SELECT muted_until FROM express_vet_dispatcher_status WHERE dispatcher_id = $1`, [
      dispatcherId,
    ]);
    const mutedUntil = result.rows[0]?.muted_until ?? null;
    return NextResponse.json({ muted_until: mutedUntil && new Date(mutedUntil) > new Date() ? mutedUntil : null });
  } catch (error) {
    console.error("express-vet dispatcher/mute GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

    const result = await db.query(
      `INSERT INTO express_vet_dispatcher_status (dispatcher_id, muted_until, last_seen_at, updated_at)
       VALUES ($1, now() + interval '${MUTE_MINUTES} minutes', now(), now())
       ON CONFLICT (dispatcher_id) DO UPDATE
         SET muted_until = EXCLUDED.muted_until, last_seen_at = now(), updated_at = now()
       RETURNING muted_until`,
      [dispatcherId]
    );

    return NextResponse.json({ muted_until: result.rows[0].muted_until });
  } catch (error) {
    console.error("express-vet dispatcher/mute POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
