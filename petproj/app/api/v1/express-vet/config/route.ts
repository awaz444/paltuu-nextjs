import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { EXPRESS_VET_CATEGORY_LABELS, EXPRESS_VET_CATEGORY_SPECIES } from "@/lib/expressVet/catalog";

export const dynamic = "force-dynamic";

async function loadSetting(key: string): Promise<any> {
  const res = await db.query(`SELECT setting_value FROM app_settings WHERE setting_key = $1`, [key]);
  const stored = res.rows[0]?.setting_value;
  if (!stored) return null;
  return typeof stored === "string" ? JSON.parse(stored) : stored;
}

/**
 * @swagger
 * /api/v1/express-vet/config:
 *   get:
 *     summary: Vets at Home (Express Vet) config — enabled cities, categories, rate cards, and the questionnaire schema (V1)
 *     tags: [v1 Express Vet]
 */
export async function GET(_req: NextRequest) {
  try {
    const [enabledCities, requestExpiryHours, questionnaires, rateCardsRes] = await Promise.all([
      loadSetting("express_vet_enabled_cities"),
      loadSetting("express_vet_request_expiry_hours"),
      loadSetting("express_vet_questionnaires"),
      db.query(
        `SELECT category, species, sub_service, city_id, starting_price_pkr
         FROM express_vet_rate_cards
         WHERE is_active = true`
      ),
    ]);

    const categories = Object.entries(EXPRESS_VET_CATEGORY_LABELS).map(([key, label]) => ({
      key,
      label,
      species: EXPRESS_VET_CATEGORY_SPECIES[key],
    }));

    return NextResponse.json({
      enabled_cities: enabledCities ?? { city_ids: [] },
      request_expiry_hours: requestExpiryHours ?? {},
      categories,
      rate_cards: rateCardsRes.rows,
      questionnaires: questionnaires ?? { version: null, schema: {} },
    });
  } catch (error) {
    console.error("express-vet config GET error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
