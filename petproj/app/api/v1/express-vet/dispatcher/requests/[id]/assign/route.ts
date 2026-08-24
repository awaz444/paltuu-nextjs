import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkDispatcher } from "@/lib/expressVet/dispatcherAuth";
import { createProvider, findOrCreateSelfProvider, InvalidProviderError } from "@/lib/expressVet/providers";
import { ExpressVetNotifications } from "@/lib/notifications";
import { checkSelfDeal } from "@/lib/expressVet/selfDealGuard";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/express-vet/dispatcher/requests/{id}/assign:
 *   post:
 *     summary: Confirm price + provider for a claimed Vets at Home (Express Vet) request (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest, context: any) {
  const dispatcher = await checkDispatcher(req);
  if (!dispatcher) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = context?.params?.id;
  if (!id) return NextResponse.json({ error: "No ID provided" }, { status: 400 });
  const dispatcherId = Number(dispatcher.id || dispatcher.user_id);

  try {
    const body = await req.json();
    const finalPricePkr = Number(body?.final_price_pkr);
    if (!Number.isFinite(finalPricePkr) || finalPricePkr <= 0) {
      return NextResponse.json({ error: "final_price_pkr must be a positive number" }, { status: 400 });
    }

    const requestRes = await db.query(`SELECT * FROM express_vet_requests WHERE request_id = $1`, [id]);
    const requestRow = requestRes.rows[0];
    if (!requestRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });
    if (requestRow.status !== "claimed") {
      return NextResponse.json({ error: `Cannot assign a request that is ${requestRow.status}` }, { status: 409 });
    }
    if (dispatcher.role !== "admin" && Number(requestRow.claimed_by_dispatcher_id) !== dispatcherId) {
      return NextResponse.json({ error: "Only the dispatcher who claimed this request can assign it" }, { status: 403 });
    }

    // Resolve exactly one of: existing provider_id, a brand-new provider, or self-assign.
    let provider;
    if (body.self_assign === true) {
      // The JWT (mobile Bearer tokens especially) doesn't reliably carry `name`, and this
      // name only gets set once per dispatcher (on first self-assign), so it's worth a
      // fresh DB read rather than trusting whatever's in the token.
      const dispatcherUserRes = await db.query(`SELECT name FROM users WHERE user_id = $1`, [dispatcherId]);
      const dispatcherName = dispatcherUserRes.rows[0]?.name || dispatcher.name || "Dispatcher";
      provider = await findOrCreateSelfProvider(dispatcherId, dispatcherName, requestRow.category);
    } else if (body.new_provider) {
      provider = await createProvider(dispatcherId, body.new_provider);
    } else if (body.provider_id) {
      const providerRes = await db.query(`SELECT * FROM express_vet_providers WHERE provider_id = $1 AND is_active = true`, [
        body.provider_id,
      ]);
      provider = providerRes.rows[0];
      if (!provider) return NextResponse.json({ error: "Provider not found or inactive" }, { status: 400 });
    } else {
      return NextResponse.json(
        { error: "Provide exactly one of: provider_id, new_provider, self_assign" },
        { status: 400 }
      );
    }

    // Self-dealing gate — the real one. Claiming is reversible and low-value; THIS is the
    // step that decides who gets paid, and `self_assign` makes the dispatcher the provider
    // outright. Runs after the provider is resolved so the provider's own identity (linked
    // account, phone) is part of the comparison, not just the dispatcher's.
    const { verdict, clientMessage } = await checkSelfDeal({
      requestRow: requestRow,
      dispatcherId,
      provider,
      stage: "assign",
    });
    if (verdict.blocked) {
      return NextResponse.json({ error: clientMessage }, { status: 403 });
    }

    // Non-blocking same-day double-booking check — real scheduling happens by phone off-app,
    // so this only catches accidental double-assignment, never hard-blocks it (see handoff doc §4).
    if (!body.force) {
      const conflictRes = await db.query(
        `SELECT COUNT(*)::int AS n FROM express_vet_requests
         WHERE assigned_provider_id = $1 AND status = 'assigned' AND assigned_at::date = CURRENT_DATE`,
        [provider.provider_id]
      );
      const conflictCount = conflictRes.rows[0]?.n ?? 0;
      if (conflictCount > 0) {
        return NextResponse.json({
          needs_confirmation: true,
          warning: `This provider already has ${conflictCount} active job${conflictCount > 1 ? "s" : ""} today — assign anyway?`,
        });
      }
    }

    const result = await db.query(
      `UPDATE express_vet_requests
       SET status = 'assigned', final_price_pkr = $1, assigned_provider_id = $2,
           assigned_by_dispatcher_id = $3, assigned_at = now()
       WHERE request_id = $4
       RETURNING *`,
      [finalPricePkr, provider.provider_id, dispatcherId, id]
    );

    await ExpressVetNotifications.onAssigned(requestRow.client_user_id, id, provider.name, finalPricePkr);

    return NextResponse.json({ request: result.rows[0], provider });
  } catch (error) {
    if (error instanceof InvalidProviderError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("express-vet dispatcher assign POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
