"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker, Table, Segmented } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { useAuth } from "@/context/AuthContext";

const { RangePicker } = DatePicker;

// Same tokens as app/admin-user/UserGrowthChart.tsx — single-series sequential blue.
const SERIES_COLOR = "#2a78d6";
const GRID_COLOR = "#e1e0d9";
const AXIS_COLOR = "#c3c2b7";
const MUTED_TEXT = "#898781";
const SECONDARY_TEXT = "#52514e";
const PRIMARY_TEXT = "#0b0b0b";

interface Summary {
    page_views: number;
    visitors: number;
    sessions: number;
    signed_in_views: number;
    mobile_views: number;
    tablet_views: number;
    desktop_views: number;
    cta_clicks: number;
    ad_impressions: number;
    ad_clicks: number;
}
interface DayRow { date: string; page_views: number; visitors: number; cta_clicks: number }
interface PageRow {
    path: string;
    section: string;
    page_type: string;
    page_views: number;
    visitors: number;
    median_seconds: number | null;
    entrances: number;
    bounce_rate_pct: number | null;
}
interface CtaRow {
    surface: string;
    label: string;
    cta: string;
    clicks: number;
    unique_users: number;
    surface_views: number;
    ctr_pct: number | null;
}
interface AdRow { ad_slot: string; impressions: number; reach: number; clicks: number; ctr_pct: number | null }
interface PageTypeRow {
    page_type: string;
    section: string;
    page_views: number;
    visitors: number;
    scrolled_views: number;
    scroll_50_pct: number;
    scroll_100_pct: number;
}
interface TrafficData {
    from: string;
    to: string;
    previous_from: string;
    previous_to: string;
    summary: Summary;
    previous: Summary;
    daily: DayRow[];
    pages: PageRow[];
    ctas: CtaRow[];
    ads: AdRow[];
    referrers: { source: string; page_views: number }[];
    cities: { city: string; page_views: number; visitors: number }[];
    page_types: PageTypeRow[];
}

const PRESETS = { "7 days": 7, "28 days": 28, "90 days": 90 } as const;
type Preset = keyof typeof PRESETS | "Custom";
const SECTION_FILTERS = ["all", "adopt", "care", "content", "marketplace", "other"] as const;

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (num: number, den: number) => (den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—");
const pctVal = (v: number | null) => (v == null ? "—" : `${v}%`);
const seconds = (s: number | null) => {
    if (s == null) return "—";
    if (s < 60) return `${Math.round(s)}s`;
    return `${Math.floor(s / 60)}m ${Math.round(s % 60)}s`;
};

/** % change vs the previous window, or a points change for shares. */
function delta(curr: number, prev: number): { text: string; tone: "up" | "down" | "flat" } | null {
    if (prev === 0) return curr > 0 ? { text: "new", tone: "up" } : null;
    const change = ((curr - prev) / prev) * 100;
    if (Math.abs(change) < 0.05) return { text: "0%", tone: "flat" };
    return { text: `${change > 0 ? "+" : ""}${change.toFixed(1)}%`, tone: change > 0 ? "up" : "down" };
}
function pointsDelta(curr: number, prev: number): { text: string; tone: "up" | "down" | "flat" } | null {
    const change = curr - prev;
    if (Math.abs(change) < 0.05) return { text: "0 pts", tone: "flat" };
    return { text: `${change > 0 ? "+" : ""}${change.toFixed(1)} pts`, tone: change > 0 ? "up" : "down" };
}

const StatTile = ({
    label,
    value,
    sub,
    change,
}: {
    label: string;
    value: string;
    sub?: string;
    change?: { text: string; tone: "up" | "down" | "flat" } | null;
}) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
        <div className="mt-1 flex items-baseline gap-2">
            <p className="text-2xl font-bold text-gray-900 tabular-nums">{value}</p>
            {change && (
                <span
                    className={`text-xs font-semibold tabular-nums ${
                        change.tone === "up" ? "text-green-700" : change.tone === "down" ? "text-red-700" : "text-gray-500"
                    }`}
                >
                    {change.tone === "up" ? "▲ " : change.tone === "down" ? "▼ " : ""}
                    {change.text}
                </span>
            )}
        </div>
        {sub && <p className="mt-0.5 text-xs text-gray-500">{sub}</p>}
    </div>
);

const Section = ({
    title,
    desc,
    csvHref,
    actions,
    children,
}: {
    title: string;
    desc?: string;
    csvHref?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) => (
    <section className="bg-white rounded-lg border border-gray-200 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3">
            <div>
                <h2 className="text-base font-bold text-gray-900">{title}</h2>
                {desc && <p className="text-xs text-gray-500 mt-0.5">{desc}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
                {actions}
                {csvHref && (
                    <a
                        href={csvHref}
                        className="text-xs font-semibold text-primary border border-primary rounded-full px-3 py-1 hover:bg-primary/5"
                    >
                        Export CSV
                    </a>
                )}
            </div>
        </div>
        {children}
    </section>
);

const ChartTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const d: DayRow = payload[0].payload;
    return (
        <div
            style={{
                background: "#ffffff",
                border: "1px solid rgba(11,11,11,0.10)",
                borderRadius: 8,
                padding: "8px 12px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            }}
        >
            <div style={{ color: SECONDARY_TEXT, fontSize: 12, marginBottom: 4 }}>
                {dayjs(label).format("ddd, MMM D, YYYY")}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ width: 10, height: 2, background: SERIES_COLOR, display: "inline-block" }} />
                <span style={{ color: PRIMARY_TEXT, fontWeight: 700, fontSize: 15 }}>{fmt(d.page_views)}</span>
                <span style={{ color: SECONDARY_TEXT, fontSize: 12 }}>page views</span>
            </div>
            <div style={{ color: MUTED_TEXT, fontSize: 12, marginTop: 2 }}>
                {fmt(d.visitors)} visitors · {fmt(d.cta_clicks)} CTA clicks
            </div>
        </div>
    );
};

const pageColumns: ColumnsType<PageRow> = [
    { title: "Path", dataIndex: "path", render: (p: string) => <span className="font-mono text-xs break-all">{p}</span> },
    { title: "Section", dataIndex: "section", width: 110 },
    { title: "Views", dataIndex: "page_views", align: "right", width: 80, render: fmt, sorter: (a, b) => a.page_views - b.page_views, defaultSortOrder: "descend" },
    { title: "Visitors", dataIndex: "visitors", align: "right", width: 90, render: fmt, sorter: (a, b) => a.visitors - b.visitors },
    {
        title: "Median time",
        dataIndex: "median_seconds",
        align: "right",
        width: 110,
        render: seconds,
        sorter: (a, b) => (a.median_seconds ?? -1) - (b.median_seconds ?? -1),
    },
    {
        title: "Bounce rate",
        dataIndex: "bounce_rate_pct",
        align: "right",
        width: 110,
        render: (v: number | null, r) => (v == null ? "—" : <span title={`${fmt(r.entrances)} sessions landed here`}>{v}%</span>),
        sorter: (a, b) => (a.bounce_rate_pct ?? -1) - (b.bounce_rate_pct ?? -1),
    },
];

const adColumns: ColumnsType<AdRow> = [
    { title: "Slot", dataIndex: "ad_slot", render: (s: string) => <span className="font-mono text-xs">{s}</span> },
    { title: "Impressions", dataIndex: "impressions", align: "right", render: fmt },
    { title: "Reach", dataIndex: "reach", align: "right", render: fmt },
    { title: "Clicks", dataIndex: "clicks", align: "right", render: fmt },
    { title: "CTR", dataIndex: "ctr_pct", align: "right", render: pctVal },
];

export default function TrafficDashboard() {
    const { user, isHydrating } = useAuth();
    const router = useRouter();

    const [preset, setPreset] = useState<Preset>("28 days");
    const [range, setRange] = useState<[Dayjs, Dayjs]>([dayjs().subtract(27, "day"), dayjs()]);
    const [section, setSection] = useState<(typeof SECTION_FILTERS)[number]>("all");
    const [data, setData] = useState<TrafficData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
    }, [user, isHydrating, router]);

    const from = range[0].format("YYYY-MM-DD");
    const to = range[1].format("YYYY-MM-DD");
    const csv = (report: string) => `/api/v1/admin/traffic?format=csv&report=${report}&from=${from}&to=${to}`;

    useEffect(() => {
        if (isHydrating || user?.role !== "admin") return;
        let cancelled = false;
        setLoading(true);
        setError(null);
        fetch(`/api/v1/admin/traffic?from=${from}&to=${to}`)
            .then(async (r) => {
                if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error ?? `HTTP ${r.status}`);
                return r.json();
            })
            .then((d: TrafficData) => !cancelled && setData(d))
            .catch((e) => !cancelled && setError(e.message))
            .finally(() => !cancelled && setLoading(false));
        return () => {
            cancelled = true;
        };
    }, [from, to, user, isHydrating]);

    const onPreset = (p: Preset) => {
        setPreset(p);
        if (p !== "Custom") setRange([dayjs().subtract(PRESETS[p] - 1, "day"), dayjs()]);
    };

    const pages = useMemo(
        () => (data?.pages ?? []).filter((p) => section === "all" || p.section === section),
        [data, section],
    );

    // Grouped by surface: the server orders rows busiest surface first, and the
    // surface cell spans its group's rows.
    const ctaColumns: ColumnsType<CtaRow> = useMemo(() => {
        const rows = data?.ctas ?? [];
        const spans = rows.map((r, i) => {
            if (i > 0 && rows[i - 1].surface === r.surface) return 0;
            let n = 1;
            while (rows[i + n]?.surface === r.surface) n++;
            return n;
        });
        return [
            {
                title: "Surface",
                dataIndex: "surface",
                width: 150,
                onCell: (_, i) => ({ rowSpan: spans[i ?? 0] }),
                render: (s: string, r) => (
                    <div>
                        <div className="font-medium text-gray-900">{s}</div>
                        <div className="text-xs text-gray-500">{fmt(r.surface_views)} views</div>
                    </div>
                ),
            },
            {
                title: "CTA",
                dataIndex: "label",
                render: (label: string, r) => (
                    <div>
                        <div>{label}</div>
                        <div className="font-mono text-[11px] text-gray-400">{r.cta}</div>
                    </div>
                ),
            },
            { title: "Fires", dataIndex: "clicks", align: "right", width: 80, render: fmt },
            { title: "Unique users", dataIndex: "unique_users", align: "right", width: 110, render: fmt },
            { title: "CTR", dataIndex: "ctr_pct", align: "right", width: 80, render: pctVal },
        ];
    }, [data]);

    if (isHydrating || !user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="loader"></div>
            </div>
        );
    }
    if (user.role !== "admin") {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-600">Unauthorized. Only admins can access this page.</p>
            </div>
        );
    }

    const s = data?.summary;
    const p = data?.previous;
    const signedInShare = s && s.page_views ? (s.signed_in_views / s.page_views) * 100 : 0;
    const prevSignedInShare = p && p.page_views ? (p.signed_in_views / p.page_views) * 100 : 0;
    const compareLabel = data
        ? `vs ${dayjs(data.previous_from).format("MMM D")} – ${dayjs(data.previous_to).format("MMM D")}`
        : "";

    return (
        <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-primary">Traffic &amp; CTAs</h1>
                        <p className="text-sm text-gray-600">
                            Public website only (paltuu.pk). Dates are Pakistan time; changes are {compareLabel || "vs the previous period"}.
                            Refreshes at most once a minute.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        <Segmented
                            options={[...Object.keys(PRESETS), "Custom"]}
                            value={preset}
                            onChange={(v) => onPreset(v as Preset)}
                        />
                        <RangePicker
                            value={range}
                            allowClear={false}
                            disabledDate={(d) => d.isAfter(dayjs(), "day")}
                            onChange={(v) => {
                                if (v && v[0] && v[1]) {
                                    setPreset("Custom");
                                    setRange([v[0], v[1]]);
                                }
                            }}
                        />
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
                        Couldn&apos;t load traffic data: {error}
                    </div>
                )}

                <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${loading ? "opacity-50" : ""}`}>
                    <StatTile label="Page views" value={s ? fmt(s.page_views) : "—"} change={s && p ? delta(s.page_views, p.page_views) : null} />
                    <StatTile
                        label="Unique visitors"
                        value={s ? fmt(s.visitors) : "—"}
                        change={s && p ? delta(s.visitors, p.visitors) : null}
                        sub="Excludes cookie rejecters"
                    />
                    <StatTile
                        label="Signed-in share"
                        value={s ? pct(s.signed_in_views, s.page_views) : "—"}
                        change={s && p && p.page_views ? pointsDelta(signedInShare, prevSignedInShare) : null}
                        sub="Of page views"
                    />
                    <StatTile
                        label="Mobile / desktop"
                        value={s ? `${pct(s.mobile_views, s.page_views)} / ${pct(s.desktop_views, s.page_views)}` : "—"}
                        sub={s && s.tablet_views ? `${pct(s.tablet_views, s.page_views)} tablet` : "Website visitors' devices"}
                    />
                    <StatTile
                        label="CTA clicks"
                        value={s ? fmt(s.cta_clicks) : "—"}
                        change={s && p ? delta(s.cta_clicks, p.cta_clicks) : null}
                        sub={s ? `${pct(s.cta_clicks, s.page_views)} of page views` : undefined}
                    />
                    <StatTile
                        label="Ad clicks"
                        value={s ? fmt(s.ad_clicks) : "—"}
                        change={s && p ? delta(s.ad_clicks, p.ad_clicks) : null}
                        sub={s ? `${fmt(s.ad_impressions)} impressions · ${pct(s.ad_clicks, s.ad_impressions)} CTR` : undefined}
                    />
                </div>

                <Section title="Page views per day" csvHref={csv("daily")}>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data?.daily ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.18} />
                                        <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} stroke={GRID_COLOR} />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={(d) => dayjs(d).format("MMM D")}
                                    tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                                    axisLine={{ stroke: AXIS_COLOR }}
                                    tickLine={false}
                                    minTickGap={24}
                                />
                                <YAxis
                                    allowDecimals={false}
                                    tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={48}
                                    tickFormatter={fmt}
                                />
                                <Tooltip content={<ChartTooltip />} cursor={{ stroke: AXIS_COLOR, strokeDasharray: "3 3" }} />
                                <Area
                                    type="monotone"
                                    dataKey="page_views"
                                    stroke={SERIES_COLOR}
                                    strokeWidth={2}
                                    fill="url(#trafficFill)"
                                    activeDot={{ r: 4, stroke: "#ffffff", strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </Section>

                <Section
                    title="Top pages"
                    desc="Median time = visible time on the page. Bounce rate = sessions that landed here and left without a second page."
                    csvHref={csv("pages")}
                    actions={
                        <Segmented
                            size="small"
                            options={SECTION_FILTERS.map((f) => ({ label: f === "all" ? "All" : f[0].toUpperCase() + f.slice(1), value: f }))}
                            value={section}
                            onChange={(v) => setSection(v as (typeof SECTION_FILTERS)[number])}
                        />
                    }
                >
                    <Table
                        size="small"
                        rowKey={(r) => `${r.path}|${r.page_type}`}
                        loading={loading}
                        dataSource={pages}
                        columns={pageColumns}
                        pagination={{ pageSize: 15, showSizeChanger: false }}
                        scroll={{ x: 640 }}
                    />
                </Section>

                <Section
                    title="Top CTAs"
                    desc="Grouped by the page type they fire on. CTR = fires ÷ views of that page type."
                    csvHref={csv("ctas")}
                >
                    <Table
                        size="small"
                        rowKey={(r) => `${r.surface}|${r.cta}`}
                        loading={loading}
                        dataSource={data?.ctas ?? []}
                        columns={ctaColumns}
                        pagination={false}
                        scroll={{ x: 600, y: 520 }}
                        bordered
                    />
                </Section>

                <Section
                    title="Brand ad slots"
                    desc="Impression = slot at least half on screen, once per page view. Reach = unique visitors who saw it."
                    csvHref={csv("ads")}
                >
                    <Table
                        size="small"
                        rowKey="ad_slot"
                        loading={loading}
                        dataSource={data?.ads ?? []}
                        columns={adColumns}
                        pagination={false}
                        scroll={{ x: 480 }}
                        locale={{
                            emptyText: (
                                <span className="text-gray-500 text-sm">
                                    No ad slots recorded yet. Wrap a placement in{" "}
                                    <code className="text-xs">&lt;AdSlot slot=&quot;…&quot;&gt;</code> to start tracking it.
                                </span>
                            ),
                        }}
                    />
                </Section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Section title="By page type" desc="Scroll columns only apply to content pages (blog posts, pet / vet / product pages).">
                        <Table
                            size="small"
                            rowKey="page_type"
                            loading={loading}
                            pagination={false}
                            dataSource={data?.page_types ?? []}
                            scroll={{ x: 360 }}
                            columns={[
                                { title: "Page type", dataIndex: "page_type" },
                                { title: "Views", dataIndex: "page_views", align: "right", render: fmt },
                                {
                                    title: "Read 50%",
                                    dataIndex: "scroll_50_pct",
                                    align: "right",
                                    render: (v: number, r: PageTypeRow) => (r.scrolled_views ? `${v}%` : "—"),
                                },
                                {
                                    title: "Read all",
                                    dataIndex: "scroll_100_pct",
                                    align: "right",
                                    render: (v: number, r: PageTypeRow) => (r.scrolled_views ? `${v}%` : "—"),
                                },
                            ]}
                        />
                    </Section>
                    <Section title="Traffic sources" desc="Referring site of each visit's landing page.">
                        <Table
                            size="small"
                            rowKey="source"
                            loading={loading}
                            pagination={false}
                            dataSource={data?.referrers ?? []}
                            columns={[
                                { title: "Source", dataIndex: "source" },
                                { title: "Views", dataIndex: "page_views", align: "right", render: fmt },
                            ]}
                        />
                    </Section>
                    <Section title="Cities" desc="From the visitor's IP address, approximate.">
                        <Table
                            size="small"
                            rowKey="city"
                            loading={loading}
                            pagination={false}
                            dataSource={data?.cities ?? []}
                            columns={[
                                { title: "City", dataIndex: "city" },
                                { title: "Views", dataIndex: "page_views", align: "right", render: fmt },
                                { title: "Visitors", dataIndex: "visitors", align: "right", render: fmt },
                            ]}
                        />
                    </Section>
                </div>
            </div>
        </div>
    );
}
