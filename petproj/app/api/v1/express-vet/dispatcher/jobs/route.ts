import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/jobs:
 *   get:
 *     summary: The current dispatcher's own assigned/completed Vets at Home (Express Vet) jobs, or (admins, ?scope=team) every dispatcher's jobs with a dispatcher_name column (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(req: NextRequest) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const dispatcherId = Number(dispatcher.id || dispatcher.user_id);
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status"); // 'assigned' | 'completed' | undefined (both)
    const scope = searchParams.get("scope"); // 'team' | undefined (own jobs only)

    if (scope === "team" && dispatcher.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const isTeamScope = scope === "team";

    const conditions: string[] = [];
    const params: any[] = [];
    if (!isTeamScope) {
      params.push(dispatcherId);
      conditions.push(`assigned_by_dispatcher_id = $${params.length}`);
    }
    if (status === "assigned" || status === "completed") {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    } else {
      conditions.push(`status IN ('assigned', 'completed')`);
    }

    const result = await db.query(
      `SELECT r.*, u.name AS client_name, u.profile_image_url AS client_photo_url,
              p.name AS provider_name${isTeamScope ? ", d.name AS dispatcher_name" : ""}
       FROM express_vet_requests r
       JOIN users u ON u.user_id = r.client_user_id
       LEFT JOIN express_vet_providers p ON p.provider_id = r.assigned_provider_id${
         isTeamScope ? "\n       LEFT JOIN users d ON d.user_id = r.assigned_by_dispatcher_id" : ""
       }
       WHERE ${conditions.join(" AND ")}
       ORDER BY r.assigned_at DESC`,
      params
    );

    return NextResponse.json({ data: result.rows });
  } catch (error) {
    console.error("express-vet dispatcher/jobs GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
