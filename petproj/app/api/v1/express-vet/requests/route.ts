import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import { isValidExpressVetCategory, isValidExpressVetSpecies, EXPRESS_VET_CATEGORY_LABELS } from "@/lib/expressVet/catalog";
import { ExpressVetNotifications } from "@/lib/notifications";
import { emitExpressVetNewRequest } from "@/utils/realtimeEmitter";
import { sendDispatcherCallAlert } from "@/lib/expressVet/dispatcherCallPush";

export const dynamic = "force-dynamic";

const QUESTIONNAIRE_SETTING_KEY = "express_vet_questionnaires";
const ENABLED_CITIES_SETTING_KEY = "express_vet_enabled_cities";

/**
 * @swagger
 * /api/v1/express-vet/requests:
 *   post:
 *     summary: Create a Vets at Home (Express Vet) request (V1)
 *     tags: [v1 Express Vet]
 */
export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      category,
      species,
      sub_service,
      city_id,
      questionnaire_answers,
      address_line,
      address_landmark,
      latitude,
      longitude,
      contact_phone,
    } = body;

    const validation = validate(
      { category, species, city_id, address_line, contact_phone },
      {
        category: { required: true, type: "string" },
        species: { required: true, type: "string" },
        city_id: { required: true, type: "number" },
        address_line: { required: true, type: "string" },
        contact_phone: { required: true, type: "string" },
      }
    );
    if (!validation.success) return NextResponse.json({ errors: validation.errors }, { status: 400 });

    if (!isValidExpressVetCategory(category)) {
      return NextResponse.json({ error: `Unknown category: ${category}` }, { status: 400 });
    }
    if (!isValidExpressVetSpecies(category, species)) {
      return NextResponse.json({ error: `Species '${species}' is not valid for category '${category}'` }, { status: 400 });
    }

    // City gate — re-validated server-side, never trust the client's own gating decision.
    const enabledCitiesRes = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [
      ENABLED_CITIES_SETTING_KEY,
    ]);
    const enabledCityIds: number[] = enabledCitiesRes.rows[0]?.setting_value?.city_ids ?? [];
    if (!enabledCityIds.includes(Number(city_id))) {
      return NextResponse.json({ error: "Vets at Home is not available in this city yet" }, { status: 403 });
    }

    // Price is re-derived server-side from the active rate card — the client's displayed
    // "starting from" figure is never trusted as the price of record.
    const rateCardRes = await db.query(
      `SELECT starting_price_pkr FROM express_vet_rate_cards
       WHERE category = $1 AND species = $2 AND city_id = $3
         AND sub_service IS NOT DISTINCT FROM $4
         AND is_active = true
       LIMIT 1`,
      [category, species, city_id, sub_service ?? null]
    );
    const rateCard = rateCardRes.rows[0];
    if (!rateCard) {
      return NextResponse.json({ error: "No active pricing found for this selection" }, { status: 400 });
    }

    const questionnaireSettingRes = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [
      QUESTIONNAIRE_SETTING_KEY,
    ]);
    const questionnaireVersion: string = questionnaireSettingRes.rows[0]?.setting_value?.version ?? "unknown";

    const result = await db.query(
      `INSERT INTO express_vet_requests (
         client_user_id, category, species, sub_service, city_id, status,
         questionnaire_version, questionnaire_answers,
         address_line, address_landmark, latitude, longitude,
         contact_phone, starting_price_pkr
       ) VALUES (
         $1, $2, $3, $4, $5, 'pending_dispatch',
         $6, $7::jsonb,
         $8, $9, $10, $11,
         $12, $13
       ) RETURNING *`,
      [
        userId,
        category,
        species,
        sub_service ?? null,
        city_id,
        questionnaireVersion,
        JSON.stringify(questionnaire_answers ?? {}),
        address_line,
        address_landmark ?? null,
        latitude ?? null,
        longitude ?? null,
        contact_phone,
        rateCard.starting_price_pkr,
      ]
    );

    const request = result.rows[0];

    // Alert on-duty dispatchers — push is the reliability layer, the socket broadcast
    // (see server/social-realtime.js's "express_vet:dispatchers" room) is the speed layer.
    // Best-effort: a failure here must never fail the request submission itself.
    try {
      const onDutyRes = await db.query(
        `SELECT dispatcher_id FROM express_vet_dispatcher_status WHERE is_on_duty = true`
      );
      const categoryLabel = EXPRESS_VET_CATEGORY_LABELS[category] ?? category;

      // Client profile snapshot for the ringing-call alert's on-screen "who's calling"
      // info — looked up once and reused for every on-duty dispatcher.
      const clientRes = await db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]);
      const clientProfile = clientRes.rows[0] ?? {};

      await Promise.allSettled(
        onDutyRes.rows.map((row: { dispatcher_id: number }) =>
          ExpressVetNotifications.onNewRequest(row.dispatcher_id, request.request_id, categoryLabel)
        )
      );

      // Native ringing-call alert — separate channel from the push notification above,
      // see lib/expressVet/dispatcherCallPush.ts for why. Fire-and-forget in parallel,
      // never lets a single dispatcher's failed/missing token affect the others.
      await Promise.allSettled(
        onDutyRes.rows.map((row: { dispatcher_id: number }) =>
          sendDispatcherCallAlert(row.dispatcher_id, {
            request_id: request.request_id,
            category,
            client_name: clientProfile.name ?? "A Paltuu user",
            client_photo_url: clientProfile.profile_image_url ?? null,
            address_line,
            starting_price_pkr: rateCard.starting_price_pkr,
            contact_phone,
          })
        )
      );

      await emitExpressVetNewRequest(request);
    } catch (notifyError) {
      console.error("express-vet requests POST — dispatcher alert failed:", notifyError);
    }

    return NextResponse.json({ request }, { status: 201 });
  } catch (error) {
    console.error("express-vet requests POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
