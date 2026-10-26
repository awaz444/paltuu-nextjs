import { db } from "@/db/index";
import { NextRequest, NextResponse } from "next/server";
import { checkAdmin } from "../adminAuth";

export const dynamic = "force-dynamic";

/**
 * @swagger
 * /api/v1/admin/app-ratio:
 *   get:
 *     summary: Mobile App vs Web Adoption, Signups, Signins, and Trend (Admin V1)
 *     description: |
 *       Returns key adoption ratios, app vs web signup/signin metrics, weekly trends,
 *       and supports CSV export of users without the app for marketing outreach.
 *       Query params:
 *         export=without_app | all (returns CSV download)
 *     tags: [v1 Admin]
 */
export async function GET(req: NextRequest) {
    try {
        const admin = await checkAdmin(req);
        if (!admin) {
            return NextResponse.json({ message: "Unauthorized. Admin role required." }, { status: 401 });
        }

        const url = new URL(req.url);
        const exportType = url.searchParams.get("export");

        // Handle CSV Export
        if (exportType === "without_app" || exportType === "all") {
            const isWithoutApp = exportType === "without_app";
            const exportQuery = isWithoutApp
                ? `
                SELECT 
                    u.user_id,
                    COALESCE(u.name, '') as name,
                    COALESCE(u.email, '') as email,
                    COALESCE(u.phone_number, '') as phone_number,
                    u.created_at,
                    u.last_login_at
                FROM users u
                WHERE NOT EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id)
                  AND u.app_platform IS NULL
                  AND u.last_app_seen_at IS NULL
                ORDER BY u.created_at DESC
                `
                : `
                SELECT 
                    u.user_id,
                    COALESCE(u.name, '') as name,
                    COALESCE(u.email, '') as email,
                    COALESCE(u.phone_number, '') as phone_number,
                    CASE 
                      WHEN EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id) 
                           OR u.app_platform IS NOT NULL 
                           OR u.last_app_seen_at IS NOT NULL THEN 'App'
                      ELSE 'Web Only'
                    END as app_status,
                    COALESCE(u.app_platform, (SELECT device_platform FROM user_devices ud WHERE ud.user_id = u.user_id LIMIT 1), 'web') as platform,
                    COALESCE(u.signup_source, 'web') as signup_source,
                    u.created_at,
                    u.last_login_at,
                    u.last_app_seen_at
                FROM users u
                ORDER BY u.created_at DESC
                `;

            const res = await db.query(exportQuery);
            const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi" }).format(new Date());

            let csvContent = "";
            if (isWithoutApp) {
                csvContent = "User ID,Name,Email,Phone Number,Created At (PKT),Last Login At\n";
                csvContent += res.rows
                    .map((r) =>
                        [
                            r.user_id,
                            `"${String(r.name).replace(/"/g, '""')}"`,
                            `"${String(r.email).replace(/"/g, '""')}"`,
                            `"${String(r.phone_number).replace(/"/g, '""')}"`,
                            r.created_at ? new Date(r.created_at).toISOString() : "",
                            r.last_login_at ? new Date(r.last_login_at).toISOString() : "",
                        ].join(",")
                    )
                    .join("\n");
            } else {
                csvContent = "User ID,Name,Email,Phone Number,App Status,Platform,Signup Source,Created At,Last Login At,Last App Seen At\n";
                csvContent += res.rows
                    .map((r) =>
                        [
                            r.user_id,
                            `"${String(r.name).replace(/"/g, '""')}"`,
                            `"${String(r.email).replace(/"/g, '""')}"`,
                            `"${String(r.phone_number).replace(/"/g, '""')}"`,
                            r.app_status,
                            r.platform,
                            r.signup_source,
                            r.created_at ? new Date(r.created_at).toISOString() : "",
                            r.last_login_at ? new Date(r.last_login_at).toISOString() : "",
                            r.last_app_seen_at ? new Date(r.last_app_seen_at).toISOString() : "",
                        ].join(",")
                    )
                    .join("\n");
            }

            const filename = isWithoutApp
                ? `paltuu-web-only-users-${today}.csv`
                : `paltuu-all-users-app-status-${today}.csv`;

            return new NextResponse(csvContent, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="${filename}"`,
                },
            });
        }

        // 1. Overall Summary Metrics
        const summaryRes = await db.query(`
            WITH app_users AS (
                SELECT DISTINCT user_id FROM user_devices
                UNION
                SELECT user_id FROM users WHERE last_app_seen_at IS NOT NULL OR app_platform IS NOT NULL
            )
            SELECT 
                COUNT(*) as total_users,
                COUNT(a.user_id) as with_app,
                COUNT(*) - COUNT(a.user_id) as without_app,
                COUNT(CASE WHEN u.app_platform = 'ios' OR EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id AND ud.device_platform = 'ios') THEN 1 END) as ios_users,
                COUNT(CASE WHEN u.app_platform = 'android' OR EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id AND ud.device_platform = 'android') THEN 1 END) as android_users,
                COUNT(CASE WHEN (u.app_platform = 'ios' OR EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id AND ud.device_platform = 'ios')) 
                            AND (u.app_platform = 'android' OR EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id AND ud.device_platform = 'android')) THEN 1 END) as both_platforms,
                COUNT(CASE WHEN u.last_app_seen_at >= NOW() - INTERVAL '30 days' 
                             OR EXISTS (SELECT 1 FROM user_devices ud WHERE ud.user_id = u.user_id AND ud.last_used >= NOW() - INTERVAL '30 days') THEN 1 END) as active_app_30d,
                COUNT(CASE WHEN a.user_id IS NULL AND u.last_login_at >= NOW() - INTERVAL '30 days' THEN 1 END) as active_web_30d,
                COUNT(CASE WHEN u.signup_source = 'app' THEN 1 END) as app_signups,
                COUNT(CASE WHEN u.signup_source = 'web' OR u.signup_source IS NULL THEN 1 END) as web_signups,
                COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '7 days' AND u.signup_source = 'app' THEN 1 END) as app_signups_7d,
                COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '7 days' AND (u.signup_source = 'web' OR u.signup_source IS NULL) THEN 1 END) as web_signups_7d,
                COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' AND u.signup_source = 'app' THEN 1 END) as app_signups_30d,
                COUNT(CASE WHEN u.created_at >= NOW() - INTERVAL '30 days' AND (u.signup_source = 'web' OR u.signup_source IS NULL) THEN 1 END) as web_signups_30d
            FROM users u
            LEFT JOIN app_users a ON u.user_id = a.user_id
        `);

        const summaryRow = summaryRes.rows[0];
        const totalUsers = parseInt(summaryRow.total_users || "0");
        const withApp = parseInt(summaryRow.with_app || "0");
        const withoutApp = parseInt(summaryRow.without_app || "0");
        const appRatioPct = totalUsers > 0 ? Number(((withApp / totalUsers) * 100).toFixed(1)) : 0;

        // 2. Audit Logs Analysis for Signins & Signups
        const auditRes = await db.query(`
            SELECT 
                COUNT(CASE WHEN action LIKE '%app' OR user_agent ILIKE '%okhttp%' OR user_agent ILIKE '%darwin%' OR user_agent ILIKE '%[app:%' THEN 1 END) as total_app_logins,
                COUNT(CASE WHEN (action = 'login' OR action = 'login_web') AND user_agent NOT ILIKE '%okhttp%' AND user_agent NOT ILIKE '%darwin%' AND user_agent NOT ILIKE '%[app:%' THEN 1 END) as total_web_logins,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' AND (action LIKE '%app' OR user_agent ILIKE '%okhttp%' OR user_agent ILIKE '%darwin%' OR user_agent ILIKE '%[app:%') THEN 1 END) as app_logins_7d,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '7 days' AND (action = 'login' OR action = 'login_web') AND user_agent NOT ILIKE '%okhttp%' AND user_agent NOT ILIKE '%darwin%' AND user_agent NOT ILIKE '%[app:%' THEN 1 END) as web_logins_7d,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' AND (action LIKE '%app' OR user_agent ILIKE '%okhttp%' OR user_agent ILIKE '%darwin%' OR user_agent ILIKE '%[app:%') THEN 1 END) as app_logins_30d,
                COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' AND (action = 'login' OR action = 'login_web') AND user_agent NOT ILIKE '%okhttp%' AND user_agent NOT ILIKE '%darwin%' AND user_agent NOT ILIKE '%[app:%' THEN 1 END) as web_logins_30d
            FROM audit_logs
            WHERE action LIKE 'login%'
        `);
        const auditRow = auditRes.rows[0];

        // 3. Weekly Trend (Last 16 Weeks)
        const weeklyRes = await poolQueryWeekly();

        // 4. Recent Activity (Recent 20 events)
        const recentRes = await db.query(`
            SELECT 
                al.audit_log_id,
                al.user_id,
                u.name,
                u.email,
                al.action,
                al.user_agent,
                al.ip_address,
                al.created_at,
                CASE 
                    WHEN al.action LIKE '%app' OR al.user_agent ILIKE '%okhttp%' OR al.user_agent ILIKE '%darwin%' OR al.user_agent ILIKE '%[app:%' THEN 'app'
                    ELSE 'web'
                END as client_type,
                CASE 
                    WHEN al.user_agent ILIKE '%[app:ios]%' OR al.user_agent ILIKE '%darwin%' OR al.user_agent ILIKE '%iphone%' THEN 'iOS'
                    WHEN al.user_agent ILIKE '%[app:android]%' OR al.user_agent ILIKE '%okhttp%' OR al.user_agent ILIKE '%android%' THEN 'Android'
                    ELSE 'Web'
                END as platform_detected
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.user_id
            WHERE al.action IN ('login', 'login_app', 'login_web', 'signup_app', 'signup_web')
            ORDER BY al.created_at DESC
            LIMIT 25
        `);

        return NextResponse.json({
            success: true,
            summary: {
                total_users: totalUsers,
                with_app: withApp,
                without_app: withoutApp,
                app_ratio_pct: appRatioPct,
                ios_users: parseInt(summaryRow.ios_users || "0"),
                android_users: parseInt(summaryRow.android_users || "0"),
                both_platforms: parseInt(summaryRow.both_platforms || "0"),
                active_app_30d: parseInt(summaryRow.active_app_30d || "0"),
                active_web_30d: parseInt(summaryRow.active_web_30d || "0"),
            },
            signups: {
                total_app: parseInt(summaryRow.app_signups || "0"),
                total_web: parseInt(summaryRow.web_signups || "0"),
                total: totalUsers,
                app_ratio_pct: totalUsers > 0 ? Number(((parseInt(summaryRow.app_signups || "0") / totalUsers) * 100).toFixed(1)) : 0,
                last_7d: {
                    app: parseInt(summaryRow.app_signups_7d || "0"),
                    web: parseInt(summaryRow.web_signups_7d || "0"),
                    total: parseInt(summaryRow.app_signups_7d || "0") + parseInt(summaryRow.web_signups_7d || "0"),
                },
                last_30d: {
                    app: parseInt(summaryRow.app_signups_30d || "0"),
                    web: parseInt(summaryRow.web_signups_30d || "0"),
                    total: parseInt(summaryRow.app_signups_30d || "0") + parseInt(summaryRow.web_signups_30d || "0"),
                },
            },
            signins: {
                total_app: parseInt(auditRow.total_app_logins || "0"),
                total_web: parseInt(auditRow.total_web_logins || "0"),
                total: parseInt(auditRow.total_app_logins || "0") + parseInt(auditRow.total_web_logins || "0"),
                app_ratio_pct:
                    parseInt(auditRow.total_app_logins || "0") + parseInt(auditRow.total_web_logins || "0") > 0
                        ? Number(
                              (
                                  (parseInt(auditRow.total_app_logins || "0") /
                                      (parseInt(auditRow.total_app_logins || "0") + parseInt(auditRow.total_web_logins || "0"))) *
                                  100
                              ).toFixed(1)
                          )
                        : 0,
                last_7d: {
                    app: parseInt(auditRow.app_logins_7d || "0"),
                    web: parseInt(auditRow.web_logins_7d || "0"),
                    total: parseInt(auditRow.app_logins_7d || "0") + parseInt(auditRow.web_logins_7d || "0"),
                },
                last_30d: {
                    app: parseInt(auditRow.app_logins_30d || "0"),
                    web: parseInt(auditRow.web_logins_30d || "0"),
                    total: parseInt(auditRow.app_logins_30d || "0") + parseInt(auditRow.web_logins_30d || "0"),
                },
            },
            weekly_trends: weeklyRes,
            recent_activity: recentRes.rows,
        });
    } catch (error) {
        console.error("V1 Admin App Ratio error:", error);
        return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
    }
}

async function poolQueryWeekly() {
    const weeklyQuery = `
        WITH RECURSIVE weeks AS (
          SELECT date_trunc('week', NOW() - INTERVAL '15 weeks')::date as week_start
          UNION ALL
          SELECT (week_start + INTERVAL '1 week')::date
          FROM weeks
          WHERE week_start < date_trunc('week', NOW())::date
        ),
        user_data AS (
          SELECT 
            u.user_id,
            u.created_at,
            u.signup_source,
            COALESCE(u.last_app_seen_at, MIN(d.created_at)) as app_joined_at,
            CASE WHEN u.last_app_seen_at IS NOT NULL OR MIN(d.created_at) IS NOT NULL THEN 1 ELSE 0 END as has_app
          FROM users u
          LEFT JOIN user_devices d ON u.user_id = d.user_id
          GROUP BY u.user_id, u.created_at, u.signup_source, u.last_app_seen_at
        )
        SELECT 
          to_char(w.week_start, 'YYYY-MM-DD') as week_start,
          COUNT(u.user_id) FILTER (WHERE date_trunc('week', u.created_at)::date = w.week_start) as new_signups,
          COUNT(u.user_id) FILTER (WHERE date_trunc('week', u.created_at)::date = w.week_start AND (u.signup_source = 'app' OR u.has_app = 1)) as new_app_signups,
          COUNT(u.user_id) FILTER (WHERE date_trunc('week', u.created_at)::date = w.week_start AND (u.signup_source = 'web' AND u.has_app = 0)) as new_web_signups,
          (SELECT COUNT(*) FROM user_data WHERE created_at < (w.week_start + INTERVAL '1 week')) as cumulative_users,
          (SELECT COUNT(*) FROM user_data WHERE has_app = 1 AND app_joined_at < (w.week_start + INTERVAL '1 week')) as cumulative_app_users
        FROM weeks w
        LEFT JOIN user_data u ON date_trunc('week', u.created_at)::date = w.week_start
        GROUP BY w.week_start
        ORDER BY w.week_start ASC
    `;

    const res = await db.query(weeklyQuery);
    return res.rows.map((r) => {
        const cumUsers = parseInt(r.cumulative_users || "0");
        const cumApp = parseInt(r.cumulative_app_users || "0");
        const ratio = cumUsers > 0 ? Number(((cumApp / cumUsers) * 100).toFixed(1)) : 0;
        return {
            week_start: r.week_start,
            new_signups: parseInt(r.new_signups || "0"),
            new_app_signups: parseInt(r.new_app_signups || "0"),
            new_web_signups: parseInt(r.new_web_signups || "0"),
            cumulative_users: cumUsers,
            cumulative_app_users: cumApp,
            cumulative_app_ratio_pct: ratio,
        };
    });
}
