import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { validate } from "@/utils/validation";
import {
  isValidExpressVetCategory,
  isValidExpressVetSpecies,
  EXPRESS_VET_CATEGORY_LABELS,
  EXPRESS_VET_GROOMING_ITEM_KEYS,
  parseGroomingCart,
  isWithinDispatcherAlertHoursPKT,
} from "@/lib/expressVet/catalog";
import { ExpressVetNotifications } from "@/lib/notifications";
import { emitExpressVetNewRequest } from "@/utils/realtimeEmitter";
import { sendDispatcherCallAlert } from "@/lib/expressVet/dispatcherCallPush";
import { rateLimit, LIMITS } from "@/lib/rateLimit";

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

    // Every accepted request (in-hours) rings every alertable dispatcher's phone, so burst
    // creation is both a spam vector and the setup half of a self-dealing pattern (create jobs on one
    // account, claim them on another — see lib/expressVet/selfDealGuard.ts).
    const limited = await rateLimit(req, LIMITS.EXPRESS_VET_REQUEST, `evreq:${userId}`, {
      message: "You've been temporarily blocked due to too many requests — please try again in about an hour.",
    });
    if (limited) return limited;

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
      maps_link,
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
    if (category === "grooming") {
      const cartKeys = parseGroomingCart(sub_service);
      if (cartKeys.length === 0) {
        return NextResponse.json({ error: "Select at least one grooming service" }, { status: 400 });
      }
      const unknownKey = cartKeys.find((k) => !EXPRESS_VET_GROOMING_ITEM_KEYS.includes(k));
      if (unknownKey) {
        return NextResponse.json({ error: `Unknown grooming item: ${unknownKey}` }, { status: 400 });
      }
    }

    // City gate — re-validated server-side, never trust the client's own gating decision.
    const enabledCitiesRes = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [
      ENABLED_CITIES_SETTING_KEY,
    ]);
    const enabledCityIds: number[] = enabledCitiesRes.rows[0]?.setting_value?.city_ids ?? [];
    if (!enabledCityIds.includes(Number(city_id))) {
      return NextResponse.json({ error: "Vets at Home is not available in this city yet" }, { status: 403 });
    }

    // One active booking at a time — a second in-flight request from the same client would
    // just confuse dispatch (which one gets the call?) and the persistent booking bar (which
    // one does it track?). "Active" = not yet closed out: anything short of cancelled, or
    // completed but still unreviewed (the client still has a pending action — leave a review).
    const activeRes = await db.query(
      `SELECT request_id FROM express_vet_requests r
       WHERE r.client_user_id = $1
         AND r.status != 'cancelled' AND r.status != 'expired'
         AND (r.status != 'completed' OR NOT EXISTS (
           SELECT 1 FROM express_vet_reviews rv WHERE rv.request_id = r.request_id
         ))
       LIMIT 1`,
      [userId]
    );
    if (activeRes.rows[0]) {
      return NextResponse.json(
        {
          error: "You already have an active Vets at Home booking. Finish or cancel it before starting a new one.",
          existing_request_id: activeRes.rows[0].request_id,
        },
        { status: 409 }
      );
    }

    // Price is re-derived server-side — the client's displayed "starting from" figure is
    // never trusted as the price of record. Grooming sums every cart item's active rate card
    // row; every other category is still a single (category, species) lookup.
    let startingPricePkr: number;
    if (category === "grooming") {
      const cartKeys = parseGroomingCart(sub_service);
      const rateCardsRes = await db.query(
        `SELECT sub_service, starting_price_pkr FROM express_vet_rate_cards
         WHERE category = $1 AND species = $2 AND city_id = $3
           AND sub_service = ANY($4::text[])
           AND is_active = true`,
        [category, species, city_id, cartKeys]
      );
      const priceByKey = new Map(rateCardsRes.rows.map((r: any) => [r.sub_service, r.starting_price_pkr]));
      const missing = cartKeys.find((k) => !priceByKey.has(k));
      if (missing) {
        return NextResponse.json({ error: `No active pricing found for '${missing}'` }, { status: 400 });
      }
      startingPricePkr = cartKeys.reduce((sum, k) => sum + Number(priceByKey.get(k)), 0);
    } else {
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
      startingPricePkr = rateCard.starting_price_pkr;
    }

    const questionnaireSettingRes = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [
      QUESTIONNAIRE_SETTING_KEY,
    ]);
    const questionnaireVersion: string = questionnaireSettingRes.rows[0]?.setting_value?.version ?? "unknown";

    const result = await db.query(
      `INSERT INTO express_vet_requests (
         client_user_id, category, species, sub_service, city_id, status,
         questionnaire_version, questionnaire_answers,
         address_line, address_landmark, latitude, longitude, maps_link,
         contact_phone, starting_price_pkr
       ) VALUES (
         $1, $2, $3, $4, $5, 'pending_dispatch',
         $6, $7::jsonb,
         $8, $9, $10, $11, $12,
         $13, $14
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
        maps_link ?? null,
        contact_phone,
        startingPricePkr,
      ]
    );

    const request = result.rows[0];

    // Alert dispatchers — push is the reliability layer, the socket broadcast (see
    // server/social-realtime.js's "express_vet:dispatchers" room) is the speed layer.
    // Best-effort: a failure here must never fail the request submission itself.
    //
    // No on/off duty toggle: every dispatcher-role user is alertable any time the phone
    // should ring at all (10am-10pm PKT — see isWithinDispatcherAlertHoursPKT), minus
    // whoever's individually muted for the next 30 minutes. Outside that window, nobody
    // gets pinged — the request still lands in everyone's inbox for whenever they next
    // check the app, it just doesn't ring.
    try {
      const alertableRes = isWithinDispatcherAlertHoursPKT()
        ? await db.query(
            `SELECT u.user_id AS dispatcher_id FROM users u
             LEFT JOIN express_vet_dispatcher_status s ON s.dispatcher_id = u.user_id
             WHERE u.role = 'dispatcher' AND (s.muted_until IS NULL OR s.muted_until <= now())`
          )
        : { rows: [] as { dispatcher_id: number }[] };
      const categoryLabel = EXPRESS_VET_CATEGORY_LABELS[category] ?? category;

      // Client profile snapshot for the ringing-call alert's on-screen "who's calling"
      // info — looked up once and reused for every alertable dispatcher.
      const clientRes = await db.query(`SELECT name, profile_image_url FROM users WHERE user_id = $1`, [userId]);
      const clientProfile = clientRes.rows[0] ?? {};

      await Promise.allSettled(
        alertableRes.rows.map((row: { dispatcher_id: number }) =>
          ExpressVetNotifications.onNewRequest(row.dispatcher_id, request.request_id, categoryLabel)
        )
      );

      // Native ringing-call alert — separate channel from the push notification above,
      // see lib/expressVet/dispatcherCallPush.ts for why. Fire-and-forget in parallel,
      // never lets a single dispatcher's failed/missing token affect the others.
      await Promise.allSettled(
        alertableRes.rows.map((row: { dispatcher_id: number }) =>
          sendDispatcherCallAlert(row.dispatcher_id, {
            request_id: request.request_id,
            category,
            client_name: clientProfile.name ?? "A Paltuu user",
            client_photo_url: clientProfile.profile_image_url ?? null,
            address_line,
            starting_price_pkr: request.starting_price_pkr,
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
