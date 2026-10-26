"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, Tag, Button, Spin, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Line,
    ComposedChart,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

interface Summary {
    total_users: number;
    with_app: number;
    without_app: number;
    app_ratio_pct: number;
    ios_users: number;
    android_users: number;
    both_platforms: number;
    active_app_30d: number;
    active_web_30d: number;
}

interface SplitPeriod {
    app: number;
    web: number;
    total: number;
}

interface SignupsData {
    total_app: number;
    total_web: number;
    total: number;
    app_ratio_pct: number;
    last_7d: SplitPeriod;
    last_30d: SplitPeriod;
}

interface SigninsData {
    total_app: number;
    total_web: number;
    total: number;
    app_ratio_pct: number;
    last_7d: SplitPeriod;
    last_30d: SplitPeriod;
}

interface WeeklyTrend {
    week_start: string;
    new_signups: number;
    new_app_signups: number;
    new_web_signups: number;
    cumulative_users: number;
    cumulative_app_users: number;
    cumulative_app_ratio_pct: number;
}

interface RecentActivity {
    audit_log_id: string;
    user_id: number;
    name: string | null;
    email: string | null;
    action: string;
    user_agent: string | null;
    ip_address: string | null;
    created_at: string;
    client_type: "app" | "web";
    platform_detected: "iOS" | "Android" | "Web";
}

interface AppAdoptionResponse {
    success: boolean;
    summary: Summary;
    signups: SignupsData;
    signins: SigninsData;
    weekly_trends: WeeklyTrend[];
    recent_activity: RecentActivity[];
}

const fmt = (n: number) => (n ?? 0).toLocaleString("en-US");
const pct = (val: number) => `${(val ?? 0).toFixed(1)}%`;

const StatTile = ({
    label,
    value,
    sub,
    highlight,
    badge,
}: {
    label: string;
    value: string;
    sub?: React.ReactNode;
    highlight?: boolean;
    badge?: string;
}) => (
    <div
        className={`rounded-xl border p-4 sm:p-5 transition-all shadow-sm ${
            highlight
                ? "bg-gradient-to-br from-blue-50 to-indigo-50/50 border-blue-200 ring-1 ring-blue-100"
                : "bg-white border-gray-200"
        }`}
    >
        <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
            {badge && (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                    {badge}
                </span>
            )}
        </div>
        <div className="mt-2 flex items-baseline gap-2">
            <p className={`text-2xl sm:text-3xl font-extrabold tabular-nums ${highlight ? "text-blue-900" : "text-gray-900"}`}>
                {value}
            </p>
        </div>
        {sub && <div className="mt-1 text-xs text-gray-600">{sub}</div>}
    </div>
);

const Section = ({
    title,
    desc,
    actions,
    children,
}: {
    title: string;
    desc?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
            </div>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        {children}
    </section>
);

export default function AppAdoptionPage() {
    const { user, isHydrating } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<AppAdoptionResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Auth verification
    useEffect(() => {
        if (!isHydrating && (!user || user.role !== "admin")) {
            router.push("/admin-panel");
        }
    }, [user, isHydrating, router]);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/v1/admin/app-ratio");
            if (!res.ok) {
                throw new Error(`Failed to load app adoption data (status ${res.status})`);
            }
            const json = await res.json();
            setData(json);
        } catch (err: any) {
            console.error("App Adoption fetch error:", err);
            setError(err.message || "Failed to load metrics");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === "admin") {
            fetchData();
        }
    }, [user]);

    if (isHydrating || (loading && !data)) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center">
                <Spin size="large" />
                <p className="mt-4 text-sm text-gray-500">Loading App Adoption metrics...</p>
            </div>
        );
    }

    if (!user || user.role !== "admin") {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <p className="text-red-600 font-semibold">Unauthorized. Admin access required.</p>
            </div>
        );
    }

    const summary = data?.summary;
    const signups = data?.signups;
    const signins = data?.signins;
    const weeklyTrends = data?.weekly_trends || [];
    const recentActivity = data?.recent_activity || [];

    const weeklyColumns: ColumnsType<WeeklyTrend> = [
        {
            title: "Week Starting",
            dataIndex: "week_start",
            key: "week_start",
            render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
        },
        {
            title: "New Signups",
            dataIndex: "new_signups",
            key: "new_signups",
            align: "right",
            render: (val: number) => <span className="font-semibold tabular-nums">{fmt(val)}</span>,
        },
        {
            title: "App Signups",
            dataIndex: "new_app_signups",
            key: "new_app_signups",
            align: "right",
            render: (val: number, row) => (
                <div className="text-right">
                    <span className="font-semibold text-emerald-700 tabular-nums">{fmt(val)}</span>
                    <span className="text-xs text-gray-500 ml-1">
                        ({row.new_signups > 0 ? ((val / row.new_signups) * 100).toFixed(0) : 0}%)
                    </span>
                </div>
            ),
        },
        {
            title: "Web Signups",
            dataIndex: "new_web_signups",
            key: "new_web_signups",
            align: "right",
            render: (val: number) => <span className="text-gray-600 tabular-nums">{fmt(val)}</span>,
        },
        {
            title: "Cumulative Users",
            dataIndex: "cumulative_users",
            key: "cumulative_users",
            align: "right",
            render: (val: number) => <span className="tabular-nums font-medium">{fmt(val)}</span>,
        },
        {
            title: "Cumulative App Users",
            dataIndex: "cumulative_app_users",
            key: "cumulative_app_users",
            align: "right",
            render: (val: number) => (
                <span className="text-blue-700 font-bold tabular-nums">{fmt(val)}</span>
            ),
        },
        {
            title: "Adoption Ratio",
            dataIndex: "cumulative_app_ratio_pct",
            key: "cumulative_app_ratio_pct",
            align: "right",
            render: (val: number) => (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 tabular-nums">
                    {pct(val)}
                </span>
            ),
        },
    ];

    const activityColumns: ColumnsType<RecentActivity> = [
        {
            title: "Time (PKT)",
            dataIndex: "created_at",
            key: "created_at",
            render: (val: string) => (
                <span className="text-xs text-gray-500">
                    {new Date(val).toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}
                </span>
            ),
        },
        {
            title: "User",
            key: "user",
            render: (_: any, r: RecentActivity) => (
                <div>
                    <p className="text-xs font-semibold text-gray-900">{r.name || `User #${r.user_id}`}</p>
                    <p className="text-[11px] text-gray-500">{r.email || "No email"}</p>
                </div>
            ),
        },
        {
            title: "Action",
            dataIndex: "action",
            key: "action",
            render: (action: string) => {
                const isSignup = action.includes("signup");
                return (
                    <Tag color={isSignup ? "purple" : "blue"}>
                        {action.replace("_", " ").toUpperCase()}
                    </Tag>
                );
            },
        },
        {
            title: "Platform",
            key: "platform",
            render: (_: any, r: RecentActivity) => {
                const color =
                    r.platform_detected === "iOS"
                        ? "cyan"
                        : r.platform_detected === "Android"
                        ? "green"
                        : "default";
                return (
                    <Tag color={color}>
                        {r.platform_detected === "iOS" ? " iOS App" : r.platform_detected === "Android" ? "🤖 Android App" : "🌐 Web"}
                    </Tag>
                );
            },
        },
        {
            title: "IP Address",
            dataIndex: "ip_address",
            key: "ip_address",
            render: (ip: string | null) => (
                <span className="text-xs font-mono text-gray-500">{ip || "—"}</span>
            ),
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link
                                href="/admin-panel"
                                className="text-xs font-medium text-gray-500 hover:text-gray-800 transition"
                            >
                                ← Back to Admin Panel
                            </Link>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                            📱 App Adoption & Ratio
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Mobile App vs Web adoption, platform ratio, signups, signins, and non-app marketing export.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <Button
                            type="default"
                            onClick={fetchData}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        <a
                            href="/api/v1/admin/app-ratio?export=all"
                            download
                            className="inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition"
                        >
                            Export All Users (CSV)
                        </a>
                        <a
                            href="/api/v1/admin/app-ratio?export=without_app"
                            download
                            className="inline-flex items-center justify-center px-3.5 py-1.5 border border-transparent text-xs font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition"
                        >
                            📥 Export Non-App Users ({fmt(summary?.without_app ?? 0)})
                        </a>
                    </div>
                </div>

                {error && <Alert message="Error" description={error} type="error" showIcon />}

                {/* Marketing Outreach Action Banner */}
                {summary && summary.without_app > 0 && (
                    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-xl p-4 sm:p-5 text-white shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                                    CAMPAIGN OPPORTUNITY
                                </span>
                                <h3 className="text-base font-bold">
                                    {fmt(summary.without_app)} users ({((summary.without_app / summary.total_users) * 100).toFixed(1)}%) are Web-Only
                                </h3>
                            </div>
                            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
                                We are promoting the mobile app (WhatsApp bot sends www.paltuu.pk/app). Download the CSV of web-only users to run targeted WhatsApp broadcasts or email reminders.
                            </p>
                        </div>
                        <a
                            href="/api/v1/admin/app-ratio?export=without_app"
                            download
                            className="shrink-0 px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg shadow transition"
                        >
                            Download Non-App Contacts CSV
                        </a>
                    </div>
                )}

                {/* Primary KPI Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatTile
                        label="App Adoption Ratio"
                        value={pct(summary?.app_ratio_pct ?? 0)}
                        highlight
                        badge="KEY METRIC"
                        sub={
                            <div className="space-y-1.5">
                                <div className="w-full bg-blue-200/60 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(0, summary?.app_ratio_pct ?? 0))}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[11px] text-gray-600 font-medium">
                                    <span>{fmt(summary?.with_app ?? 0)} App Users</span>
                                    <span>{fmt(summary?.total_users ?? 0)} Total</span>
                                </div>
                            </div>
                        }
                    />

                    <StatTile
                        label="Platform Distribution"
                        value={`${fmt(summary?.ios_users ?? 0)} iOS / ${fmt(summary?.android_users ?? 0)} Android`}
                        sub={
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-gray-100 text-gray-800 text-[11px] font-medium">
                                     iOS: {summary?.with_app ? ((summary.ios_users / summary.with_app) * 100).toFixed(0) : 0}%
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-green-50 text-green-800 text-[11px] font-medium">
                                    🤖 Android: {summary?.with_app ? ((summary.android_users / summary.with_app) * 100).toFixed(0) : 0}%
                                </span>
                            </div>
                        }
                    />

                    <StatTile
                        label="Active Users (Last 30 Days)"
                        value={`${fmt(summary?.active_app_30d ?? 0)} App Active`}
                        sub={
                            <div className="mt-1 text-xs text-gray-500">
                                vs {fmt(summary?.active_web_30d ?? 0)} Web-only active (
                                <span className="font-semibold text-emerald-700">
                                    {((summary?.active_app_30d ?? 0) + (summary?.active_web_30d ?? 0)) > 0
                                        ? (
                                              ((summary?.active_app_30d ?? 0) /
                                                  ((summary?.active_app_30d ?? 0) + (summary?.active_web_30d ?? 0))) *
                                              100
                                          ).toFixed(0)
                                        : 0}
                                    % on app
                                </span>
                                )
                            </div>
                        }
                    />

                    <StatTile
                        label="Web-Only Accounts"
                        value={fmt(summary?.without_app ?? 0)}
                        sub={
                            <div className="text-xs text-amber-700 font-medium mt-1">
                                {pct(100 - (summary?.app_ratio_pct ?? 0))} of user base without app
                            </div>
                        }
                    />
                </div>

                {/* App vs Web: Signups & Signins Deep Dive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Signups Breakdown */}
                    <Section
                        title="✨ Signups: App vs Web"
                        desc="Where new user accounts originate"
                    >
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-[11px] text-gray-500 uppercase font-semibold">Total Signups</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{fmt(signups?.total ?? 0)}</p>
                                <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                                    {pct(signups?.app_ratio_pct ?? 0)} from App
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <p className="text-[11px] text-emerald-700 uppercase font-semibold">App Signups</p>
                                <p className="text-xl font-bold text-emerald-900 mt-1">{fmt(signups?.total_app ?? 0)}</p>
                                <p className="text-[11px] text-emerald-600 mt-0.5">
                                    +{fmt(signups?.last_30d?.app ?? 0)} last 30d
                                </p>
                            </div>
                            <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
                                <p className="text-[11px] text-purple-700 uppercase font-semibold">Web Signups</p>
                                <p className="text-xl font-bold text-purple-900 mt-1">{fmt(signups?.total_web ?? 0)}</p>
                                <p className="text-[11px] text-purple-600 mt-0.5">
                                    +{fmt(signups?.last_30d?.web ?? 0)} last 30d
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Last 7 Days Signups:</span>
                                <span className="font-semibold text-gray-900">
                                    <span className="text-emerald-700 font-bold">{signups?.last_7d?.app ?? 0} App</span> /{" "}
                                    <span className="text-purple-700">{signups?.last_7d?.web ?? 0} Web</span> (Total {signups?.last_7d?.total ?? 0})
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Last 30 Days Signups:</span>
                                <span className="font-semibold text-gray-900">
                                    <span className="text-emerald-700 font-bold">{signups?.last_30d?.app ?? 0} App</span> /{" "}
                                    <span className="text-purple-700">{signups?.last_30d?.web ?? 0} Web</span> (Total {signups?.last_30d?.total ?? 0})
                                </span>
                            </div>
                        </div>
                    </Section>

                    {/* Signins Breakdown */}
                    <Section
                        title="🔐 Signins / Logins: App vs Web"
                        desc="Login frequency by platform in audit log"
                    >
                        <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <p className="text-[11px] text-gray-500 uppercase font-semibold">Recorded Logins</p>
                                <p className="text-xl font-bold text-gray-900 mt-1">{fmt(signins?.total ?? 0)}</p>
                                <p className="text-[11px] text-blue-700 font-medium mt-0.5">
                                    {pct(signins?.app_ratio_pct ?? 0)} on App
                                </p>
                            </div>
                            <div className="p-3 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <p className="text-[11px] text-emerald-700 uppercase font-semibold">App Logins</p>
                                <p className="text-xl font-bold text-emerald-900 mt-1">{fmt(signins?.total_app ?? 0)}</p>
                                <p className="text-[11px] text-emerald-600 mt-0.5">
                                    +{fmt(signins?.last_30d?.app ?? 0)} last 30d
                                </p>
                            </div>
                            <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100">
                                <p className="text-[11px] text-indigo-700 uppercase font-semibold">Web Logins</p>
                                <p className="text-xl font-bold text-indigo-900 mt-1">{fmt(signins?.total_web ?? 0)}</p>
                                <p className="text-[11px] text-indigo-600 mt-0.5">
                                    +{fmt(signins?.last_30d?.web ?? 0)} last 30d
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3 pt-2 border-t border-gray-100 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Last 7 Days Logins:</span>
                                <span className="font-semibold text-gray-900">
                                    <span className="text-emerald-700 font-bold">{signins?.last_7d?.app ?? 0} App</span> /{" "}
                                    <span className="text-indigo-700">{signins?.last_7d?.web ?? 0} Web</span> (Total {signins?.last_7d?.total ?? 0})
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Last 30 Days Logins:</span>
                                <span className="font-semibold text-gray-900">
                                    <span className="text-emerald-700 font-bold">{signins?.last_30d?.app ?? 0} App</span> /{" "}
                                    <span className="text-indigo-700">{signins?.last_30d?.web ?? 0} Web</span> (Total {signins?.last_30d?.total ?? 0})
                                </span>
                            </div>
                        </div>
                    </Section>
                </div>

                {/* Trend Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Cumulative Growth & Adoption Ratio Progression */}
                    <Section
                        title="📈 Cumulative Adoption Trend"
                        desc="Cumulative total users vs cumulative app users, with adoption ratio %"
                    >
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={weeklyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="week_start"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(val) => val.slice(5)}
                                    />
                                    <YAxis
                                        yAxisId="left"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => fmt(v)}
                                    />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => `${v}%`}
                                        domain={[0, 25]}
                                    />
                                    <Tooltip
                                        formatter={(val: any, name?: any) => [
                                            name === "Adoption Ratio" ? `${val}%` : fmt(val),
                                            String(name || ""),
                                        ]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulative_users"
                                        name="Total Users"
                                        fill="#e2e8f0"
                                        stroke="#94a3b8"
                                    />
                                    <Area
                                        yAxisId="left"
                                        type="monotone"
                                        dataKey="cumulative_app_users"
                                        name="App Users"
                                        fill="#bfdbfe"
                                        stroke="#2563eb"
                                        strokeWidth={2}
                                    />
                                    <Line
                                        yAxisId="right"
                                        type="monotone"
                                        dataKey="cumulative_app_ratio_pct"
                                        name="Adoption Ratio"
                                        stroke="#10b981"
                                        strokeWidth={3}
                                        dot={false}
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>

                    {/* Weekly Cohorts: New App vs Web Signups */}
                    <Section
                        title="📊 Weekly Signups by Platform"
                        desc="Number of new users acquired via App vs Web per week"
                    >
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyTrends} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="week_start"
                                        tick={{ fontSize: 11 }}
                                        tickFormatter={(val) => val.slice(5)}
                                    />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        formatter={(val: any, name?: any) => [fmt(val), String(name || "")]}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                                    <Bar
                                        dataKey="new_app_signups"
                                        name="App Signups"
                                        stackId="a"
                                        fill="#3b82f6"
                                        radius={[0, 0, 0, 0]}
                                    />
                                    <Bar
                                        dataKey="new_web_signups"
                                        name="Web Signups"
                                        stackId="a"
                                        fill="#cbd5e1"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Section>
                </div>

                {/* Weekly Cohort Breakdown Table */}
                <Section
                    title="📅 Weekly Adoption Breakdown"
                    desc="Historical weekly cohorts and adoption progression"
                >
                    <Table
                        columns={weeklyColumns}
                        dataSource={weeklyTrends}
                        rowKey="week_start"
                        pagination={{ pageSize: 8, hideOnSinglePage: false }}
                        size="small"
                        className="overflow-x-auto"
                    />
                </Section>

                {/* Recent Authentication Activity */}
                <Section
                    title="⚡ Recent Signin & Signup Activity"
                    desc="Real-time log of recent authentications showing client detection"
                >
                    <Table
                        columns={activityColumns}
                        dataSource={recentActivity}
                        rowKey="audit_log_id"
                        pagination={{ pageSize: 10 }}
                        size="small"
                        className="overflow-x-auto"
                    />
                </Section>
            </div>
        </div>
    );
}
