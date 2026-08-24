"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Reporter {
  user_id: number;
  name: string;
  reporter_trust: number;
  trust_ceiling: number;
  lifetime_dismissals: number;
}

interface Report {
  report_id: number;
  post_id: number;
  reason_code: string;
  report_weight: number;
  additional_note: string | null;
  created_at: string;
  post_preview: string;
  post_weighted_score: number;
  post_report_count: number;
  moderation_state: string;
  content_notice_reason: string | null;
  suspicious_burst_at: string | null;
  author_block_after_report: boolean;
  reporter: Reporter;
}

interface Settings { [key: string]: any; }

const REASON_LABELS: Record<string, string> = {
  SPAM: "Spam",
  HATE_SPEECH: "Hate Speech",
  HARASSMENT: "Harassment",
  ANIMAL_ABUSE: "Animal Abuse",
  MISINFORMATION: "Misinformation",
  INAPPROPRIATE: "Inappropriate",
  SCAM: "Scam",
  OTHER: "Other",
};

export default function ReportQueuePage() {
  const { user, isHydrating } = useAuth();
  const router = useRouter();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"queue" | "settings">("queue");
  const [queueFilter, setQueueFilter] = useState<"all" | "priority" | "burst" | "severe">("all");
  const [settings, setSettings] = useState<Settings>({});
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Settings>({});
  const [versions, setVersions] = useState<{ version_id: number; created_at: string; changed_by_name: string | null; settings_value: any }[]>([]);
  const [rollingBack, setRollingBack] = useState<number | null>(null);

  useEffect(() => {
    if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
  }, [user, isHydrating, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/social/reports?status=pending&sort=priority&limit=50");
      const data = await res.json();
      setReports(data.reports ?? []);
    } catch { showToast("Failed to load reports"); }
    finally { setLoading(false); }
  }, []);

  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const [settingsRes, versionsRes] = await Promise.all([
        fetch("/api/v1/admin/social/settings").then(r => r.json()),
        fetch("/api/v1/admin/social/settings/versions?limit=10").then(r => r.json()).catch(() => ({})),
      ]);
      setSettings(settingsRes.settings ?? {});
      setEditValues(settingsRes.settings ?? {});
      setVersions(versionsRes.versions ?? []);
    } finally { setSettingsLoading(false); }
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  useEffect(() => {
    if (activeTab === "settings") fetchSettings();
  }, [activeTab, fetchSettings]);

  async function handleAction(reportId: number, postId: number, action: "dismiss" | "confirm_hide" | "warn_reporter", reporterTrust?: number) {
    const confirmMsg = action === "confirm_hide" ? "Hide this post permanently?" : null;
    if (confirmMsg && !confirm(confirmMsg)) return;
    setActing(reportId);
    try {
      const res = await fetch(`/api/v1/admin/social/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { showToast("Action failed"); return; }
      if (action === "dismiss" && reporterTrust !== undefined) {
        const newTrust = Math.max(0.25, reporterTrust * 0.95);
        showToast(`Dismissed — Reporter trust: ${reporterTrust.toFixed(2)} → ${newTrust.toFixed(2)}`);
      } else {
        showToast(action === "confirm_hide" ? "Post hidden — reporter trust boosted" : "Noted");
      }
      setReports(prev => prev.filter(r => r.report_id !== reportId));
    } finally { setActing(null); }
  }

  async function handleModerate(postId: number, state: "quarantined" | "none") {
    try {
      await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      showToast(state === "quarantined" ? "Post quarantined" : "Post restored");
      setReports(prev => prev.map(r => r.post_id === postId ? { ...r, moderation_state: state } : r));
    } catch { showToast("Failed"); }
  }

  // The manual half of the pet-sale check: the detector
  // (lib/moderation/petSaleDetection.ts) only catches listings that use price
  // or sale language, so a seller who writes around it lands here instead —
  // usually reported as SCAM or OTHER. Flagging from the queue saves a trip to
  // the Post Browser, and puts the same public banner on the post that an
  // auto-flag would.
  //
  // Flag only; it deliberately does not hide anything. Taking the post down is
  // the separate Confirm Hide below, so the two decisions stay independent.
  async function handleFlagSale(postId: number) {
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice_reason: "pet_sale" }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      // Every pending report on the same post, not just this row.
      setReports(prev => prev.map(r =>
        r.post_id === postId ? { ...r, content_notice_reason: "pet_sale" } : r
      ));
      showToast("Flagged as a sale post — banner is now on the post for everyone");
    } catch { showToast("Failed"); }
  }

  async function handleRollback(versionId: number) {
    if (!confirm("Restore this settings snapshot?")) return;
    setRollingBack(versionId);
    try {
      const res = await fetch("/api/v1/admin/social/settings/rollback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version_id: versionId }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Rollback failed"); return; }
      setSettings(data.settings);
      setEditValues(data.settings);
      showToast("Settings restored");
      fetchSettings();
    } finally { setRollingBack(null); }
  }

  async function saveSetting(key: string, value: any) {
    setSavingKey(key);
    try {
      const res = await fetch("/api/v1/admin/social/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error ?? "Failed to save"); return; }
      setSettings(data.settings);
      setEditValues(data.settings);
      showToast("Saved");
    } finally { setSavingKey(null); }
  }

  if (isHydrating || loading) {
    return <div className="flex justify-center items-center h-screen"><div className="loader" /></div>;
  }
  if (!user || user.role !== "admin") {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600">Unauthorized</p></div>;
  }

  const priority = reports.filter(r => r.suspicious_burst_at || r.author_block_after_report || r.report_weight >= 0.8);
  const normal = reports.filter(r => !priority.includes(r));

  const filteredReports = (() => {
    const sorted = [...priority, ...normal];
    if (queueFilter === "priority") return sorted.filter(r => r.report_weight >= 0.8);
    if (queueFilter === "burst") return sorted.filter(r => !!r.suspicious_burst_at);
    if (queueFilter === "severe") return sorted.filter(r => ["ANIMAL_ABUSE", "HATE_SPEECH"].includes(r.reason_code));
    return sorted;
  })();

  const EDITABLE_SETTINGS = [
    { key: "auto_quarantine_weighted_threshold", label: "Auto-quarantine threshold", type: "number" },
    { key: "severity_fast_lane_threshold", label: "Fast-lane threshold (severe reports)", type: "number" },
    { key: "report_burst_count", label: "Burst count (reports / window)", type: "number" },
    { key: "report_burst_window_minutes", label: "Burst window (minutes)", type: "number" },
    { key: "min_account_age_days", label: "Min account age (days) for full weight", type: "number" },
    { key: "quarantine_grace_hours", label: "Quarantine grace window (hours)", type: "number" },
    { key: "report_immunity_hours", label: "Immunity after dismiss (hours)", type: "number" },
    { key: "feed_weight_base", label: "Feed weight — base score", type: "number" },
    { key: "feed_weight_affinity", label: "Feed weight — affinity", type: "number" },
  ];

  return (
    <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-50 text-sm">{toast}</div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
          <h1 className="text-xl font-bold text-primary">Report Queue</h1>
          <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">{reports.length} pending</span>
          {priority.length > 0 && (
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">⚡ {priority.length} priority</span>
          )}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab("queue")} className={`text-sm px-4 py-1.5 rounded-lg border transition-all ${activeTab === "queue" ? "bg-primary text-white border-primary" : "bg-white border-gray-300 text-gray-600 hover:border-primary"}`}>Queue</button>
          <button onClick={() => setActiveTab("settings")} className={`text-sm px-4 py-1.5 rounded-lg border transition-all ${activeTab === "settings" ? "bg-primary text-white border-primary" : "bg-white border-gray-300 text-gray-600 hover:border-primary"}`}>Settings</button>
        </div>
      </div>

      {/* Report Queue */}
      {activeTab === "queue" && (
        <div className="space-y-4">
          {/* Inner filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { key: "all", label: `All (${reports.length})` },
              { key: "priority", label: `⚡ Priority (${reports.filter(r => r.report_weight >= 0.8).length})` },
              { key: "burst", label: `🚨 Burst (${reports.filter(r => !!r.suspicious_burst_at).length})` },
              { key: "severe", label: `🐾 Severe (${reports.filter(r => ["ANIMAL_ABUSE","HATE_SPEECH"].includes(r.reason_code)).length})` },
            ] as { key: typeof queueFilter; label: string }[]).map(f => (
              <button
                key={f.key}
                onClick={() => setQueueFilter(f.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  queueFilter === f.key ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-300 hover:border-primary"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
              <p className="text-lg font-medium">{reports.length === 0 ? "No pending reports" : "No reports match this filter"}</p>
            </div>
          ) : filteredReports.map(report => (
            <div
              key={report.report_id}
              className={`bg-white rounded-lg shadow-lg p-5 border transition-all ${
                report.suspicious_burst_at || report.author_block_after_report
                  ? "border-orange-300"
                  : report.report_weight >= 0.8
                  ? "border-red-200"
                  : "border-gray-200"
              }`}
            >
              <div className="flex flex-col lg:flex-row gap-5">
                {/* Post info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(report.suspicious_burst_at) && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🚨 Burst flagged</span>
                    )}
                    {report.author_block_after_report && (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">🔒 Author pre-blocked</span>
                    )}
                    {["ANIMAL_ABUSE", "HATE_SPEECH"].includes(report.reason_code) && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">🐾 Severe</span>
                    )}
                    {report.report_weight >= 0.8 && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">⚡ Priority</span>
                    )}
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      report.moderation_state === "quarantined" ? "bg-orange-100 text-orange-700" :
                      report.moderation_state === "hidden" ? "bg-red-100 text-red-700" :
                      "bg-green-50 text-green-700"
                    }`}>
                      {report.moderation_state ?? "none"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-800 mb-2 line-clamp-3">{report.post_preview || "(no text)"}</p>

                  <div className="text-xs text-gray-500 space-y-0.5">
                    <p>Reason: <span className="font-medium text-gray-700">{REASON_LABELS[report.reason_code] ?? report.reason_code}</span></p>
                    <p>Weighted score: <span className="font-medium text-gray-700">{report.post_weighted_score?.toFixed(2) ?? "—"}</span> · Raw reports: {report.post_report_count ?? "—"}</p>
                    <p>This report weight: <span className="font-medium">{report.report_weight?.toFixed(2) ?? "—"}</span></p>
                    {report.additional_note && <p>Note: "{report.additional_note}"</p>}
                  </div>
                </div>

                {/* Reporter info */}
                <div className="lg:w-48 text-xs text-gray-500 space-y-1 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-5 pt-3 lg:pt-0">
                  <p className="font-medium text-gray-700">{report.reporter.name}</p>
                  <p>Trust: <span className="font-medium">{report.reporter.reporter_trust?.toFixed(2)}</span> / ceiling {report.reporter.trust_ceiling?.toFixed(2)}</p>
                  <p>Dismissals: {report.reporter.lifetime_dismissals}</p>
                  <p className="text-gray-400">{new Date(report.created_at).toLocaleDateString()}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-row lg:flex-col gap-2 lg:w-36">
                  <button
                    onClick={() => handleAction(report.report_id, report.post_id, "dismiss", report.reporter.reporter_trust)}
                    disabled={acting === report.report_id}
                    className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-all"
                  >
                    Dismiss
                  </button>
                  {report.moderation_state !== "quarantined" && report.moderation_state !== "hidden" && (
                    <button
                      onClick={() => handleModerate(report.post_id, "quarantined")}
                      disabled={acting === report.report_id}
                      className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg border border-orange-300 text-orange-700 hover:bg-orange-50 disabled:opacity-50 transition-all"
                    >
                      Quarantine
                    </button>
                  )}
                  {report.moderation_state === "quarantined" && (
                    <button
                      onClick={() => handleModerate(report.post_id, "none")}
                      className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 transition-all"
                    >
                      Restore
                    </button>
                  )}
                  {report.content_notice_reason === "pet_sale" ? (
                    <span
                      title="This post already carries the public sale banner."
                      className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg bg-purple-50 text-purple-700 text-center"
                    >
                      Sale flagged
                    </span>
                  ) : (
                    <button
                      onClick={() => handleFlagSale(report.post_id)}
                      disabled={acting === report.report_id}
                      title="The detector missed this one: mark it as a buying/selling post. The post stays visible, but every viewer sees a 'flagged: buying or selling pets' banner above it."
                      className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                    >
                      Flag: pet sale
                    </button>
                  )}
                  <button
                    onClick={() => handleAction(report.report_id, report.post_id, "confirm_hide")}
                    disabled={acting === report.report_id}
                    className="flex-1 lg:flex-none text-xs px-3 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
                  >
                    Confirm Hide
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Settings */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200 max-w-2xl">
          <h2 className="font-semibold text-gray-800 mb-5">Moderation & Feed Settings</h2>
          {settingsLoading ? (
            <div className="loader" />
          ) : (
            <div className="space-y-4">
              {EDITABLE_SETTINGS.map(({ key, label, type }) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <label className="text-sm text-gray-700 flex-1">{label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type={type}
                      step="0.01"
                      value={editValues[key] ?? ""}
                      onChange={e => setEditValues(prev => ({ ...prev, [key]: type === "number" ? parseFloat(e.target.value) : e.target.value }))}
                      className="w-24 text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary"
                    />
                    <button
                      onClick={() => saveSetting(key, editValues[key])}
                      disabled={savingKey === key || editValues[key] === settings[key]}
                      className="text-xs bg-primary text-white px-3 py-1 rounded disabled:opacity-40"
                    >
                      {savingKey === key ? "..." : "Save"}
                    </button>
                  </div>
                </div>
              ))}
              <p className="text-xs text-gray-400 pt-2">feed_weight_base + feed_weight_affinity must sum to 1.0</p>
            </div>
          )}

          {/* Version history */}
          {versions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Version History</h3>
              <div className="space-y-2">
                {versions.map((v) => (
                  <div key={v.version_id} className="flex items-center justify-between text-xs text-gray-500 border border-gray-100 rounded-lg px-3 py-2">
                    <span>
                      {new Date(v.created_at).toLocaleString()}{v.changed_by_name ? ` — by ${v.changed_by_name}` : ""}
                    </span>
                    <button
                      onClick={() => handleRollback(v.version_id)}
                      disabled={rollingBack === v.version_id}
                      className="text-xs text-primary hover:underline disabled:opacity-40 ml-4"
                    >
                      {rollingBack === v.version_id ? "Restoring…" : "Rollback"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
