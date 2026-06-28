"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/* ── Types ─────────────────────────────────────────────────────────── */
interface ArmStats {
  users: number;
  active_users: number;
  total_actions: number;
  actions_per_active_user: number;
  impressions: number;
  engagement_per_impression: number;
}

interface DashboardData {
  window_days: number;
  control: ArmStats;
  treatment: ArmStats;
  lift_actions_per_active_user: number | null;
}

interface ExperimentUser {
  user_id: number;
  name: string;
  social_username: string;
  effective_bucket: "control" | "treatment";
  is_overridden: boolean;
  engagement_count: number;
}

type ActiveTab = "dashboard" | "users";
type BucketFilter = "" | "control" | "treatment";

/* ── Helpers ────────────────────────────────────────────────────────── */
function fmt(n: number, digits = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

function ArmCard({ label, data }: { label: string; data: ArmStats }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex-1">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">{label}</p>
      <div className="space-y-3">
        <Row label="Total users" value={fmt(data.users, 0)} />
        <Row label="Active users" value={fmt(data.active_users, 0)} />
        <Row label="Total actions" value={fmt(data.total_actions, 0)} />
        <Row label="Actions / active user" value={fmt(data.actions_per_active_user)} highlight />
        <Row label="Impressions" value={fmt(data.impressions, 0)} />
        <Row label="Engagement / impression" value={fmt(data.engagement_per_impression, 3)} />
      </div>
    </div>
  );
}

function Row({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={highlight ? "font-bold text-gray-900" : "text-gray-700"}>{value}</span>
    </div>
  );
}

const BUCKET_VALUES = ["control", "treatment", "auto"] as const;
type BucketValue = (typeof BUCKET_VALUES)[number];

function BucketToggle({
  userId,
  current,
  isOverridden,
  onMove,
}: {
  userId: number;
  current: "control" | "treatment";
  isOverridden: boolean;
  onMove: (userId: number, bucket: BucketValue) => void;
}) {
  return (
    <div className="flex gap-1">
      {BUCKET_VALUES.map((b) => {
        const active =
          b === "auto"
            ? !isOverridden
            : isOverridden && current === b;
        return (
          <button
            key={b}
            onClick={() => onMove(userId, b)}
            className={`text-xs px-2 py-1 rounded capitalize border transition-colors ${
              active
                ? "bg-primary text-white border-primary"
                : "bg-white text-gray-500 border-gray-200 hover:border-primary hover:text-primary"
            }`}
          >
            {b}
          </button>
        );
      })}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────── */
export default function ExperimentPage() {
  const router = useRouter();
  const { user, isHydrating: authLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [days, setDays] = useState(30);
  const [dashData, setDashData] = useState<DashboardData | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState("");

  const [users, setUsers] = useState<ExperimentUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [bucketFilter, setBucketFilter] = useState<BucketFilter>("");
  const [userSearch, setUserSearch] = useState("");
  const [userOffset, setUserOffset] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [movingId, setMovingId] = useState<number | null>(null);
  const USER_LIMIT = 50;

  /* auth guard */
  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") router.push("/browse-pets");
  }, [authLoading, user, router]);

  /* fetch dashboard */
  useEffect(() => {
    setDashLoading(true);
    setDashError("");
    fetch(`/api/v1/admin/social/experiment?days=${days}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setDashError(d.error); return; }
        setDashData(d);
      })
      .catch(() => setDashError("Failed to load experiment data."))
      .finally(() => setDashLoading(false));
  }, [days]);

  /* fetch user list */
  const fetchUsers = (offset = 0) => {
    setUsersLoading(true);
    const params = new URLSearchParams({ limit: String(USER_LIMIT), offset: String(offset), days: String(days) });
    if (bucketFilter) params.set("bucket", bucketFilter);
    if (userSearch.trim()) params.set("q", userSearch.trim());
    fetch(`/api/v1/admin/social/experiment/users?${params}`)
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users ?? []);
        setUserTotal(d.total ?? d.users?.length ?? 0);
        setUserOffset(offset);
      })
      .catch(() => {})
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers(0);
  }, [activeTab, bucketFilter, days]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(0);
  };

  const handleMove = async (userId: number, bucket: BucketValue) => {
    setMovingId(userId);
    try {
      const res = await fetch(`/api/v1/admin/social/experiment/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bucket }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers((prev) =>
          prev.map((u) =>
            u.user_id === userId
              ? {
                  ...u,
                  effective_bucket: data.effective_bucket,
                  is_overridden: data.assignment !== "auto",
                }
              : u
          )
        );
      }
    } catch {}
    setMovingId(null);
  };

  if (authLoading) return null;
  if (!user || user.role !== "admin") {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600">Unauthorized</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/admin-panel")}
          className="text-gray-400 hover:text-primary transition-colors"
        >
          ← Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">A/B Experiment Console</h1>
          <p className="text-sm text-gray-500">Personalized feed vs. current feed</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {(["dashboard", "users"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors -mb-px ${
              activeTab === t
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {t === "dashboard" ? "Results" : "Users"}
          </button>
        ))}

        {/* Days selector */}
        <div className="ml-auto flex items-center gap-1 pb-2">
          <span className="text-xs text-gray-400">Window:</span>
          {[7, 14, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`text-xs px-2 py-1 rounded transition-colors ${
                days === d
                  ? "bg-primary text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-primary"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* ── Dashboard tab ── */}
      {activeTab === "dashboard" && (
        <>
          {dashLoading && (
            <div className="flex justify-center items-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          {dashError && <p className="text-red-600 text-sm">{dashError}</p>}
          {!dashLoading && !dashError && dashData && (
            <>
              {/* Headline lift */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 text-center">
                {dashData.lift_actions_per_active_user === null ? (
                  <p className="text-gray-400 text-sm">Not enough data yet — impressions accumulate once users open the For You tab.</p>
                ) : (
                  <>
                    <p className="text-4xl font-bold mb-1"
                      style={{
                        color:
                          dashData.lift_actions_per_active_user > 0
                            ? "#16a34a"
                            : dashData.lift_actions_per_active_user < 0
                            ? "#dc2626"
                            : "#6b7280",
                      }}
                    >
                      {dashData.lift_actions_per_active_user > 0 ? "+" : ""}
                      {(dashData.lift_actions_per_active_user * 100).toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Personalized feed engagement per active user vs. control (last {dashData.window_days} days)
                    </p>
                  </>
                )}
              </div>

              {/* Two-arm table */}
              <div className="flex gap-4">
                <ArmCard label="Control (current feed)" data={dashData.control} />
                <ArmCard label="Treatment (personalized)" data={dashData.treatment} />
              </div>

              <p className="text-xs text-gray-400 mt-4">
                Actions = likes + comments + reposts + saves. Active users = ≥1 action in the window. Impressions only count For You tab views.
              </p>
            </>
          )}
        </>
      )}

      {/* ── Users tab ── */}
      {activeTab === "users" && (
        <>
          <div className="flex flex-wrap gap-3 mb-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-[200px]">
              <input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search name or username…"
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="text-sm px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Search
              </button>
            </form>

            {/* Arm filter */}
            <div className="flex gap-1">
              {([["", "All"], ["control", "Control"], ["treatment", "Treatment"]] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => { setBucketFilter(v); fetchUsers(0); }}
                  className={`text-xs px-3 py-2 rounded-lg border capitalize transition-colors ${
                    bucketFilter === v
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-gray-500 border-gray-200 hover:border-primary"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {usersLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Arm</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Assignment</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-600">Move</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No users found.</td></tr>
                  )}
                  {users.map((u) => (
                    <tr key={u.user_id} className={movingId === u.user_id ? "opacity-50" : ""}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{u.name}</p>
                        {u.social_username && (
                          <p className="text-xs text-gray-400">@{u.social_username}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            u.effective_bucket === "treatment"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {u.effective_bucket}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs ${u.is_overridden ? "text-orange-600 font-medium" : "text-gray-400"}`}>
                          {u.is_overridden ? "Manual" : "Auto"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-700">
                        {u.engagement_count}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <BucketToggle
                          userId={u.user_id}
                          current={u.effective_bucket}
                          isOverridden={u.is_overridden}
                          onMove={handleMove}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {userTotal > USER_LIMIT && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 text-sm text-gray-500">
                  <span>
                    {userOffset + 1}–{Math.min(userOffset + USER_LIMIT, userTotal)} of {userTotal}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={userOffset === 0}
                      onClick={() => fetchUsers(userOffset - USER_LIMIT)}
                      className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:border-primary"
                    >
                      Prev
                    </button>
                    <button
                      disabled={userOffset + USER_LIMIT >= userTotal}
                      onClick={() => fetchUsers(userOffset + USER_LIMIT)}
                      className="px-3 py-1 border border-gray-200 rounded disabled:opacity-40 hover:border-primary"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
