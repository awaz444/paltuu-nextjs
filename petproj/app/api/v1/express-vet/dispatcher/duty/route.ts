import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/duty:
 *   get:
 *     summary: The current dispatcher's on-duty status for Vets at Home (Express Vet) (V1)
 *     tags: [v1 Express Vet]
 *   post:
 *     summary: Toggle a dispatcher's on-duty status for Vets at Home (Express Vet) (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);
    const result = await db.query(`SELECT * FROM express_vet_dispatcher_status WHERE dispatcher_id = $1`, [
      dispatcherId,
    ]);
    return NextResponse.json({ status: result.rows[0] ?? { dispatcher_id: dispatcherId, is_on_duty: false } });
  } catch (error) {
    console.error("express-vet dispatcher/duty GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await req.json();
    const isOnDuty = Boolean(body?.is_on_duty);
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

    const result = await db.query(
      `INSERT INTO express_vet_dispatcher_status (dispatcher_id, is_on_duty, last_seen_at, updated_at)
       VALUES ($1, $2, now(), now())
       ON CONFLICT (dispatcher_id) DO UPDATE
         SET is_on_duty = EXCLUDED.is_on_duty, last_seen_at = now(), updated_at = now()
       RETURNING *`,
      [dispatcherId, isOnDuty]
    );

    return NextResponse.json({ status: result.rows[0] });
  } catch (error) {
    console.error("express-vet dispatcher/duty POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
