import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/stats:
 *   get:
 *     summary: Summary counts for the dispatcher console — personal in-progress/completed/earnings plus pool-wide unconfirmed count, and (admins only) the same numbers company-wide (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE r.status = 'assigned' AND r.assigned_by_dispatcher_id = $1)::int AS in_progress,
         COUNT(*) FILTER (WHERE r.status = 'completed' AND r.assigned_by_dispatcher_id = $1 AND r.completed_at::date = CURRENT_DATE)::int AS completed_today,
         COUNT(*) FILTER (WHERE r.status = 'completed' AND r.assigned_by_dispatcher_id = $1)::int AS total_completed,
         COALESCE(SUM((r.final_price_pkr + COALESCE(rv.addon_total_pkr, 0))) FILTER (WHERE r.status = 'completed' AND r.assigned_by_dispatcher_id = $1), 0)::bigint AS total_earned_pkr,
         COUNT(*) FILTER (WHERE r.status = 'pending_dispatch')::int AS unconfirmed_count,
         COUNT(*) FILTER (WHERE r.status = 'assigned')::int AS team_in_progress,
         COUNT(*) FILTER (WHERE r.status = 'completed' AND r.completed_at::date = CURRENT_DATE)::int AS team_completed_today,
         COUNT(*) FILTER (WHERE r.status = 'completed')::int AS team_total_completed,
         COALESCE(SUM((r.final_price_pkr + COALESCE(rv.addon_total_pkr, 0))) FILTER (WHERE r.status = 'completed'), 0)::bigint AS team_total_earned_pkr
       FROM express_vet_requests r
       LEFT JOIN express_vet_reviews rv ON rv.request_id = r.request_id`,
      [dispatcherId]
    );

    const row = result.rows[0];

    const response: Record<string, unknown> = {
      in_progress: row.in_progress,
      completed_today: row.completed_today,
      total_completed: row.total_completed,
      total_earned_pkr: Number(row.total_earned_pkr),
      unconfirmed_count: row.unconfirmed_count,
    };

    if (dispatcher.role === "admin") {
      response.team = {
        in_progress: row.team_in_progress,
        completed_today: row.team_completed_today,
        total_completed: row.team_total_completed,
        total_earned_pkr: Number(row.team_total_earned_pkr),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("express-vet dispatcher/stats GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
