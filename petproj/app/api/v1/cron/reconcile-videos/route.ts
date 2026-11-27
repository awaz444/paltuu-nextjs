import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/index";
import { reconcileVideoJobs } from "@/lib/videoPipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/v1/cron/reconcile-videos  (PALTU-189)
 *
 * Settles videos still "pending"/"processing" by asking MediaConvert for
 * their job's outcome, so a missed or misconfigured EventBridge webhook can't
 * leave them on the raw upload. Run by Vercel Cron (vercel.json), which sends
 * `Authorization: Bearer $CRON_SECRET`. Without CRON_SECRET set, every call is
 * refused.
 *
 * `?dry_run=1` reports what it would change without writing.
 */
export async function GET(req: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
    try {
        const result = await reconcileVideoJobs(db, { limit: 100, dryRun });
        console.log(`[reconcile-videos] ${dryRun ? "dry run " : ""}${JSON.stringify(result)}`);
        return NextResponse.json({ dryRun, ...result });
    } catch (error) {
        console.error("[reconcile-videos] failed:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
