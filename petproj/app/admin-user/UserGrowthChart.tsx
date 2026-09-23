"use client";

import { useMemo, useState } from "react";
import dayjs, { Dayjs } from "dayjs";
import { DatePicker } from "antd";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { User } from "../types/user";

const { RangePicker } = DatePicker;

// Sequential blue — dataviz skill default hue for a single trend series.
const SERIES_COLOR = "#2a78d6";
const GRID_COLOR = "#e1e0d9";
const AXIS_COLOR = "#c3c2b7";
const MUTED_TEXT = "#898781";
const SECONDARY_TEXT = "#52514e";
const PRIMARY_TEXT = "#0b0b0b";

interface UserGrowthChartProps {
    users: User[];
}

interface DayPoint {
    date: string; // YYYY-MM-DD
    total: number;
    newUsers: number;
}

const formatCount = (n: number) => n.toLocaleString("en-US");

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    const point: DayPoint = payload[0].payload;
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
                {dayjs(label).format("MMM D, YYYY")}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                <span style={{ width: 10, height: 2, background: SERIES_COLOR, display: "inline-block" }} />
                <span style={{ color: PRIMARY_TEXT, fontWeight: 700, fontSize: 15 }}>
                    {formatCount(point.total)}
                </span>
                <span style={{ color: SECONDARY_TEXT, fontSize: 12 }}>total users</span>
            </div>
            <div style={{ color: MUTED_TEXT, fontSize: 12, marginTop: 2 }}>
                +{formatCount(point.newUsers)} new that day
            </div>
        </div>
    );
};

const UserGrowthChart = ({ users }: UserGrowthChartProps) => {
    const validDates = useMemo(
        () =>
            users
                .map((u) => (u.created_at ? dayjs(u.created_at) : null))
                .filter((d): d is Dayjs => !!d && d.isValid())
                .sort((a, b) => a.valueOf() - b.valueOf()),
        [users]
    );

    const earliest = validDates[0] ?? dayjs().subtract(30, "day");
    const latest = validDates[validDates.length - 1] ?? dayjs();

    const defaultStart = latest.subtract(29, "day").isAfter(earliest)
        ? latest.subtract(29, "day").startOf("day")
        : earliest.startOf("day");

    const [range, setRange] = useState<[Dayjs, Dayjs]>([defaultStart, latest.endOf("day")]);

    const data = useMemo<DayPoint[]>(() => {
        if (!validDates.length) return [];

        const start = range[0].startOf("day");
        const end = range[1].endOf("day");

        // Cumulative total as of `start` (users created before the visible window).
        let runningTotal = validDates.filter((d) => d.isBefore(start)).length;

        const points: DayPoint[] = [];
        let cursor = start.clone();
        while (!cursor.isAfter(end, "day")) {
            const dayStart = cursor.startOf("day");
            const dayEnd = cursor.endOf("day");
            const newUsers = validDates.filter(
                (d) => !d.isBefore(dayStart) && !d.isAfter(dayEnd)
            ).length;
            runningTotal += newUsers;
            points.push({
                date: dayStart.format("YYYY-MM-DD"),
                total: runningTotal,
                newUsers,
            });
            cursor = cursor.add(1, "day");
        }
        return points;
    }, [validDates, range]);

    const rangeStartValue = data.length ? data[0].total - data[0].newUsers : 0;
    const rangeEndValue = data.length ? data[data.length - 1].total : 0;
    const netGrowth = rangeEndValue - rangeStartValue;

    const presets = [
        { label: "Last 7 days", value: [latest.subtract(6, "day").startOf("day"), latest.endOf("day")] as [Dayjs, Dayjs] },
        { label: "Last 30 days", value: [latest.subtract(29, "day").startOf("day"), latest.endOf("day")] as [Dayjs, Dayjs] },
        { label: "Last 90 days", value: [latest.subtract(89, "day").startOf("day"), latest.endOf("day")] as [Dayjs, Dayjs] },
        { label: "All time", value: [earliest.startOf("day"), latest.endOf("day")] as [Dayjs, Dayjs] },
    ];

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-gray-800">User Growth</h2>
                    <p className="text-sm text-gray-500">
                        Total registered users over the selected date range
                    </p>
                </div>
                <RangePicker
                    value={range}
                    onChange={(vals) => {
                        if (vals && vals[0] && vals[1]) {
                            setRange([vals[0], vals[1]]);
                        }
                    }}
                    presets={presets}
                    disabledDate={(d) => d.isAfter(latest, "day") || d.isBefore(earliest, "day")}
                    allowClear={false}
                />
            </div>

            {!data.length ? (
                <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
                    No user signups in this range.
                </div>
            ) : (
                <>
                    <div className="flex items-baseline gap-2 mb-2">
                        <span className="text-2xl font-bold text-gray-900">{formatCount(rangeEndValue)}</span>
                        <span className="text-sm text-gray-500">users as of {dayjs(data[data.length - 1].date).format("MMM D, YYYY")}</span>
                        <span
                            className="text-sm font-medium"
                            style={{ color: netGrowth >= 0 ? "#006300" : "#d03b3b" }}
                        >
                            {netGrowth >= 0 ? "+" : ""}{formatCount(netGrowth)} in range
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                            <defs>
                                <linearGradient id="userGrowthFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={SERIES_COLOR} stopOpacity={0.1} />
                                    <stop offset="100%" stopColor={SERIES_COLOR} stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeWidth={1} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(d) => dayjs(d).format("MMM D")}
                                stroke={AXIS_COLOR}
                                tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                                tickLine={false}
                                axisLine={{ stroke: AXIS_COLOR }}
                                minTickGap={32}
                            />
                            <YAxis
                                allowDecimals={false}
                                stroke={AXIS_COLOR}
                                tick={{ fill: MUTED_TEXT, fontSize: 12 }}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(v) => formatCount(v)}
                                width={56}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ stroke: AXIS_COLOR, strokeWidth: 1 }} />
                            <Area
                                type="monotone"
                                dataKey="total"
                                stroke={SERIES_COLOR}
                                strokeWidth={2}
                                fill="url(#userGrowthFill)"
                                dot={false}
                                activeDot={{ r: 4, fill: SERIES_COLOR, stroke: "#fcfcfb", strokeWidth: 2 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </>
            )}
        </div>
    );
};

export default UserGrowthChart;
