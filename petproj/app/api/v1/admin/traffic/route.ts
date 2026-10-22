import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";
import { CTA_LABELS, SECTIONS } from "@/lib/analytics/events";

/**
 * @swagger
 * /api/v1/admin/traffic:
 *   get:
 *     summary: Website traffic + CTA report from page_events (Admin V1)
 *     description: |
 *       Query params: from, to (YYYY-MM-DD, Pakistan time, inclusive; default last 28 days).
 *       The JSON response also carries the previous equal-length window's summary for % change.
 *       format=csv&report=daily|pages|ctas|ads returns that table as a CSV download.
 *     tags: [v1 Admin]
 */

const TZ = "Asia/Karachi";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const REPORTS = ["daily", "pages", "ctas", "ads"] as const;
type Report = (typeof REPORTS)[number];
const CACHE_TTL_MS = 60_000;

// Range bounds are PKT calendar days. The ::timestamp cast matters: a bare `date AT TIME ZONE`
// is cast to timestamptz first (midnight in the session zone, UTC on RDS) and then converted
// *to* PKT wall time, shifting the window by 10 hours. `timestamp AT TIME ZONE 'Asia/Karachi'`
// reads the value as PKT local time and returns the matching instant, which is what we want.
const eventsBetween = (from: string, to: string) => `
    SELECT * FROM page_events
    WHERE created_at >= (${from}::date::timestamp AT TIME ZONE '${TZ}')
      AND created_at < ((${to}::date + 1)::timestamp AT TIME ZONE '${TZ}')`;

// Every report reads from `ev`, so the JSON response is a single query on a single
// pooled connection instead of one connection per report.
const EVENTS_CTE = `WITH ev AS (${eventsBetween("$1", "$2")})`;

// Builds a CASE over constant maps from lib/analytics/events so CSV exports carry the
// same section / label the dashboard shows (no user input reaches these strings).
const quote = (s: string) => `'${s.replace(/'/g, "''")}'`;
const sectionSql = (col: string) =>
    `CASE ${Object.entries(SECTIONS)
        .map(([section, types]) => `WHEN ${col} IN (${types.map(quote).join(", ")}) THEN ${quote(section)}`)
        .join(" ")} ELSE 'other' END`;
const labelSql = (col: string) =>
    `CASE ${col} ${Object.entries(CTA_LABELS)
        .map(([key, label]) => `WHEN ${quote(key)} THEN ${quote(label)}`)
        .join(" ")} ELSE ${col} END`;

function pktToday(): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}

function shiftDays(date: string, days: number): string {
    const d = new Date(`${date}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function daysBetween(from: string, to: string): number {
    return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000) + 1;
}

const QUERIES: Record<Report, string> = {
    daily: `
        SELECT to_char(days.day, 'YYYY-MM-DD') AS date,
               COALESCE(c.page_views, 0)::int AS page_views,
               COALESCE(c.visitors, 0)::int AS visitors,
               COALESCE(c.cta_clicks, 0)::int AS cta_clicks
        FROM generate_series($1::date, $2::date, '1 day') AS days(day)
        LEFT JOIN (
            SELECT (created_at AT TIME ZONE '${TZ}')::date AS day,
                   COUNT(*) FILTER (WHERE event_type = 'page_view') AS page_views,
                   COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view') AS visitors,
                   COUNT(*) FILTER (WHERE event_type = 'cta_click') AS cta_clicks
            FROM ev GROUP BY 1
        ) c ON c.day = days.day::date
        ORDER BY days.day`,
    // Time on page = sum of a view's page_leave slices; median over views that reported any.
    // Bounce = a session whose only page view was this one, out of sessions that landed here.
    pages: `
        SELECT pv.path,
               ${sectionSql("pv.page_type")} AS section,
               pv.page_type,
               COUNT(*)::int AS page_views,
               COUNT(DISTINCT pv.visitor_id)::int AS visitors,
               ROUND((percentile_cont(0.5) WITHIN GROUP (ORDER BY t.ms) / 1000)::numeric, 1)::float AS median_seconds,
               COALESCE(MAX(l.entrances), 0)::int AS entrances,
               ROUND(100.0 * MAX(l.bounces) / NULLIF(MAX(l.entrances), 0), 1)::float AS bounce_rate_pct
        FROM ev pv
        LEFT JOIN (
            SELECT view_id, SUM(duration_ms) AS ms
            FROM ev WHERE event_type = 'page_leave' AND view_id IS NOT NULL
            GROUP BY view_id
        ) t ON t.view_id = pv.view_id
        LEFT JOIN (
            SELECT landing AS path, COUNT(*) AS entrances, COUNT(*) FILTER (WHERE views = 1) AS bounces
            FROM (
                SELECT session_id, COUNT(*) AS views, (array_agg(path ORDER BY created_at))[1] AS landing
                FROM ev WHERE event_type = 'page_view' AND session_id IS NOT NULL
                GROUP BY session_id
            ) s
            GROUP BY landing
        ) l ON l.path = pv.path
        WHERE pv.event_type = 'page_view'
        GROUP BY pv.path, pv.page_type
        ORDER BY page_views DESC
        LIMIT 200`,
    // CTR is measured against views of the page type (surface) the CTA fired on.
    // Rows are grouped by surface, busiest surface first.
    ctas: `
        SELECT c.page_type AS surface,
               ${labelSql("c.cta")} AS label,
               c.cta,
               COUNT(*)::int AS clicks,
               COUNT(DISTINCT c.visitor_id)::int AS unique_users,
               COALESCE(MAX(v.n), 0)::int AS surface_views,
               ROUND(100.0 * COUNT(*) / NULLIF(MAX(v.n), 0), 1)::float AS ctr_pct
        FROM ev c
        LEFT JOIN (
            SELECT page_type, COUNT(*) AS n FROM ev WHERE event_type = 'page_view' GROUP BY page_type
        ) v ON v.page_type = c.page_type
        WHERE c.event_type = 'cta_click'
        GROUP BY c.page_type, c.cta
        ORDER BY SUM(COUNT(*)) OVER (PARTITION BY c.page_type) DESC, c.page_type, clicks DESC
        LIMIT 300`,
    ads: `
        SELECT ad_slot,
               COUNT(*) FILTER (WHERE event_type = 'ad_impression')::int AS impressions,
               COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'ad_impression')::int AS reach,
               COUNT(*) FILTER (WHERE event_type = 'ad_click')::int AS clicks,
               ROUND(100.0 * COUNT(*) FILTER (WHERE event_type = 'ad_click')
                     / NULLIF(COUNT(*) FILTER (WHERE event_type = 'ad_impression'), 0), 2)::float AS ctr_pct
        FROM ev
        WHERE event_type IN ('ad_impression', 'ad_click')
        GROUP BY ad_slot
        ORDER BY impressions DESC`,
};

const summary = (source: string) => `
    SELECT COUNT(*) FILTER (WHERE event_type = 'page_view')::int AS page_views,
           COUNT(DISTINCT visitor_id) FILTER (WHERE event_type = 'page_view')::int AS visitors,
           COUNT(DISTINCT session_id) FILTER (WHERE event_type = 'page_view')::int AS sessions,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND user_id IS NOT NULL)::int AS signed_in_views,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND device = 'mobile')::int AS mobile_views,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND device = 'tablet')::int AS tablet_views,
           COUNT(*) FILTER (WHERE event_type = 'page_view' AND device = 'desktop')::int AS desktop_views,
           COUNT(*) FILTER (WHERE event_type = 'cta_click')::int AS cta_clicks,
           COUNT(*) FILTER (WHERE event_type = 'ad_impression')::int AS ad_impressions,
           COUNT(*) FILTER (WHERE event_type = 'ad_click')::int AS ad_clicks
    FROM ${source}`;

const BREAKDOWNS = {
    referrers: `
        SELECT COALESCE(referrer_host, 'Direct / internal') AS source, COUNT(*)::int AS page_views
        FROM ev WHERE event_type = 'page_view'
        GROUP BY 1 ORDER BY page_views DESC LIMIT 15`,
    cities: `
        SELECT COALESCE(city, 'Unknown') AS city, COUNT(*)::int AS page_views,
               COUNT(DISTINCT visitor_id)::int AS visitors
        FROM ev WHERE event_type = 'page_view'
        GROUP BY 1 ORDER BY page_views DESC LIMIT 15`,
    page_types: `
        SELECT pv.page_type,
               ${sectionSql("pv.page_type")} AS section,
               COUNT(*)::int AS page_views,
               COUNT(DISTINCT pv.visitor_id)::int AS visitors,
               COUNT(sd.view_id)::int AS scrolled_views,
               ROUND(100.0 * COUNT(*) FILTER (WHERE sd.max_depth >= 50) / COUNT(*), 1)::float AS scroll_50_pct,
               ROUND(100.0 * COUNT(*) FILTER (WHERE sd.max_depth >= 100) / COUNT(*), 1)::float AS scroll_100_pct
        FROM ev pv
        LEFT JOIN (
            SELECT view_id, MAX(scroll_depth) AS max_depth
            FROM ev WHERE event_type = 'scroll_depth' AND view_id IS NOT NULL
            GROUP BY view_id
        ) sd ON sd.view_id = pv.view_id
        WHERE pv.event_type = 'page_view'
        GROUP BY pv.page_type ORDER BY page_views DESC`,
};

const list = (sql: string) => `(SELECT COALESCE(json_agg(x), '[]'::json) FROM (${sql}) x)`;

const DASHBOARD = `${EVENTS_CTE}, ev_prev AS (${eventsBetween("$3", "$4")})
    SELECT (SELECT row_to_json(x) FROM (${summary("ev")}) x) AS summary,
           (SELECT row_to_json(x) FROM (${summary("ev_prev")}) x) AS previous,
           ${list(QUERIES.daily)} AS daily,
           ${list(QUERIES.pages)} AS pages,
           ${list(QUERIES.ctas)} AS ctas,
           ${list(QUERIES.ads)} AS ads,
           ${list(BREAKDOWNS.referrers)} AS referrers,
           ${list(BREAKDOWNS.cities)} AS cities,
           ${list(BREAKDOWNS.page_types)} AS page_types`;

// Per-instance cache: the dashboard is admin-only and a minute of staleness is fine (PALTU-32).
const cache = new Map<string, { at: number; body: unknown }>();

function toCsv(rows: Record<string, unknown>[]): string {
    if (rows.length === 0) return "";
    const cols = Object.keys(rows[0]);
    const cell = (v: unknown) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n");
}

export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
        }

        const params = req.nextUrl.searchParams;
        const to = DATE_RE.test(params.get("to") ?? "") ? params.get("to")! : pktToday();
        const from = DATE_RE.test(params.get("from") ?? "") ? params.get("from")! : shiftDays(to, -27);
        if (from > to || shiftDays(from, 366) < to) {
            return NextResponse.json({ error: "Invalid range (max 366 days)" }, { status: 400 });
        }

        if (params.get("format") === "csv") {
            const report = params.get("report") as Report;
            if (!REPORTS.includes(report)) {
                return NextResponse.json({ error: `report must be one of ${REPORTS.join(", ")}` }, { status: 400 });
            }
            const { rows } = await db.query(`${EVENTS_CTE} ${QUERIES[report]}`, [from, to]);
            return new NextResponse(toCsv(rows), {
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="paltuu-${report}-${from}-to-${to}.csv"`,
                },
            });
        }

        const key = `${from}|${to}`;
        const hit = cache.get(key);
        if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
            return NextResponse.json(hit.body);
        }

        // Previous window: the same number of days, ending the day before `from`.
        const span = daysBetween(from, to);
        const prevTo = shiftDays(from, -1);
        const prevFrom = shiftDays(from, -span);

        const { rows } = await db.query(DASHBOARD, [from, to, prevFrom, prevTo]);
        const body = { from, to, previous_from: prevFrom, previous_to: prevTo, ...rows[0] };

        if (cache.size > 50) cache.clear();
        cache.set(key, { at: Date.now(), body });
        return NextResponse.json(body);
    } catch (error) {
        console.error("V1 Admin Traffic GET Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
