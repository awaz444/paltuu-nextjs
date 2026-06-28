import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/utils/authServer";
import { MAX_INTEREST_SCORE } from "@/lib/interestScoring";

export const dynamic = "force-dynamic";

const ONBOARDING_DELTA = 1.0;

/**
 * POST /api/v1/social/interests
 * Body: { tagIds: number[] }
 * Seeds onboarding picks + interest scores (idempotent: a pick only scores once),
 * logs audit events, and moves the user into the 'warming' personalization tier.
 */
export async function POST(req: NextRequest) {
  try {
    const userIdRaw = await getUserIdFromRequest(req);
    if (!userIdRaw) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = parseInt(String(userIdRaw), 10);

    const body = await req.json();
    const tagIds: number[] = Array.isArray(body.tagIds)
      ? body.tagIds.map((t: any) => parseInt(String(t), 10)).filter((n: number) => !Number.isNaN(n))
      : [];

    if (tagIds.length === 0) {
      return NextResponse.json({ error: "tagIds must be a non-empty array" }, { status: 400 });
    }

    // Only accept ids that map to real, active tags.
    const validRes = await db.query(
      `SELECT tag_id FROM content_tags WHERE tag_id = ANY($1::int[]) AND is_active = true`,
      [tagIds]
    );
    const validIds: number[] = validRes.rows.map((r) => r.tag_id);
    if (validIds.length === 0) {
      return NextResponse.json({ error: "No valid tag ids provided" }, { status: 400 });
    }

    const client = await db.connect();
    try {
      await client.query('BEGIN');

      for (const tagId of validIds) {
        // A pick only contributes to the score the first time it's added.
        const pick = await client.query(
          `INSERT INTO user_interest_picks (user_id, tag_id)
           VALUES ($1, $2)
           ON CONFLICT (user_id, tag_id) DO NOTHING
           RETURNING tag_id`,
          [userId, tagId]
        );
        if ((pick.rowCount ?? 0) === 0) continue;

        await client.query(
          `INSERT INTO user_interest_scores (user_id, tag_id, score, updated_at)
           VALUES ($1, $2, LEAST($3, $4), NOW())
           ON CONFLICT (user_id, tag_id) DO UPDATE
             SET score = LEAST(user_interest_scores.score + $3, $4),
                 updated_at = NOW()`,
          [userId, tagId, ONBOARDING_DELTA, MAX_INTEREST_SCORE]
        );
        await client.query(
          `INSERT INTO user_interest_events (user_id, tag_id, delta, event_type)
           VALUES ($1, $2, $3, 'onboarding')`,
          [userId, tagId, ONBOARDING_DELTA]
        );
      }

      await client.query(
        `UPDATE users SET feed_personalization_tier = 'warming' WHERE user_id = $1`,
        [userId]
      );

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      client.release();
      throw e;
    }
    client.release();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Social interests POST error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
