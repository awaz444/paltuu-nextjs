import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/stats:
 *   get:
 *     summary: Quick summary counts for the dispatcher console — jobs in progress and completed today (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'assigned')::int AS in_progress,
         COUNT(*) FILTER (WHERE status = 'completed' AND completed_at::date = CURRENT_DATE)::int AS completed_today
       FROM express_vet_requests
       WHERE assigned_by_dispatcher_id = $1`,
      [dispatcherId]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("express-vet dispatcher/stats GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
