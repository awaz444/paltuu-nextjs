"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface ContentTag { tag_id: number; slug: string; label: string; role: string; }
interface ActionLogEntry {
  log_id: number;
  action: string;
  status: string | null;
  performed_at: string;
  admin_name: string | null;
}
interface Post {
  post_id: number;
  content: string;
  post_type: string;
  created_at: string;
  tagging_status: string;
  moderation_state: string;
  report_count: number;
  report_weighted_score: number;
  is_hidden: boolean;
  is_shadow_hidden: boolean;
  shadow_hide_reason: string | null;
  tags: ContentTag[];
  username: string;
  name: string;
  action_history: ActionLogEntry[];
}

type StatusFilter = "all" | "untagged" | "quarantined" | "hidden" | "shadow_hidden";

type ModerationState = "none" | "quarantined" | "hidden" | "shadow_hidden";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  untagged: "Untagged",
  quarantined: "Quarantined",
  hidden: "Hidden",
  shadow_hidden: "Shadow-hidden",
};

export default function PostBrowserPage() {
  const { user, isHydrating } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 20;

  useEffect(() => {
    if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
  }, [user, isHydrating, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fetchPosts = useCallback(async (q: string, status: StatusFilter, off: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(off),
        ...(q ? { search: q } : {}),
        ...(status !== "all" ? { status } : {}),
      });
      const res = await fetch(`/api/v1/admin/social/posts?${params}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotal(data.total ?? 0);
    } catch { showToast("Failed to load posts"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPosts(search, statusFilter, offset);
  }, [statusFilter, offset]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearch(q);
    setOffset(0);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchPosts(q, statusFilter, 0), 400);
  }

  const ACTION_TOAST: Record<ModerationState, string> = {
    hidden: "Hidden from everyone",
    shadow_hidden: "Shadow-hidden — still visible to the author only",
    quarantined: "Quarantined",
    none: "Restored",
  };

  async function handleModerate(postId: number, state: ModerationState, reason?: "pet_sale") {
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state, ...(reason ? { reason } : {}) }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.map(p =>
        p.post_id === postId
          ? {
              ...p,
              moderation_state: state,
              is_hidden: state === "hidden",
              is_shadow_hidden: state === "shadow_hidden",
              shadow_hide_reason: state === "shadow_hidden" ? (reason ?? null) : null,
            }
          : p
      ));
      showToast(reason === "pet_sale" ? "Shadow-hidden — author will see a 'we don't condone this' notice" : ACTION_TOAST[state]);
    } finally { setActingId(null); }
  }

  if (isHydrating) {
    return <div className="flex justify-center items-center h-screen"><div className="loader" /></div>;
  }
  if (!user || user.role !== "admin") {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600">Unauthorized</p></div>;
  }

  const STATE_COLORS: Record<string, string> = {
    none: "bg-green-50 text-green-700",
    quarantined: "bg-orange-100 text-orange-700",
    hidden: "bg-red-100 text-red-700",
    shadow_hidden: "bg-purple-100 text-purple-700",
  };

  const STATE_LABELS: Record<string, string> = {
    none: "none",
    quarantined: "quarantined",
    hidden: "hidden",
    shadow_hidden: "shadow-hidden",
  };

  return (
    <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-50 text-sm">{toast}</div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
          <h1 className="text-xl font-bold text-primary">Post Browser</h1>
          {total > 0 && <span className="text-xs text-gray-400">{total} posts</span>}
        </div>
      </div>

      {/* Search + filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 mb-5 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by content or @username..."
          className="flex-1 min-w-48 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
        />
        <div className="flex gap-2 flex-wrap">
          {(["all", "untagged", "quarantined", "hidden", "shadow_hidden"] as StatusFilter[]).map(s => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setOffset(0); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                statusFilter === s ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-300 hover:border-primary"
              }`}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Posts table */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="loader" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No posts found</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {posts.map(post => (
              <div key={post.post_id} className="p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 transition-colors">
                {/* Post info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1">
                    <span className="text-xs text-gray-400">#{post.post_id}</span>
                    {post.username && <span className="text-xs text-gray-500">@{post.username}</span>}
                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATE_COLORS[post.moderation_state ?? "none"]}`}>
                      {STATE_LABELS[post.moderation_state ?? "none"] ?? post.moderation_state}
                    </span>
                    {post.tagging_status === "untagged" && (
                      <span className="text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full">untagged</span>
                    )}
                    {post.shadow_hide_reason === "pet_sale" && (
                      <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full">pet sale</span>
                    )}
                    {post.report_count > 0 && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{post.report_count} reports</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800 line-clamp-2 mb-2">{post.content || "(no text)"}</p>
                  {post.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {post.tags.map(t => (
                        <span
                          key={t.tag_id}
                          className={`text-xs px-2 py-0.5 rounded-full ${t.role === "primary" ? "bg-primary text-white" : "bg-gray-100 text-gray-600"}`}
                        >
                          {t.label}
                        </span>
                      ))}
                    </div>
                  )}
                  {post.action_history?.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {post.action_history.map(entry => (
                        <p key={entry.log_id} className="text-xs text-gray-400">
                          <span className="font-medium text-gray-500">{entry.action.replace(/_/g, " ")}</span>
                          {entry.status ? ` — ${entry.status}` : ""}
                          {" · "}{new Date(entry.performed_at).toLocaleDateString()}
                          {entry.admin_name ? ` by ${entry.admin_name}` : ""}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-row sm:flex-col gap-2 sm:w-32 flex-shrink-0">
                  <Link href={`/admin-panel/social/tagging?post_id=${post.post_id}`} className="text-xs text-center px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:border-primary hover:text-primary transition-all">
                    Edit tags
                  </Link>
                  {(post.moderation_state === "none" || !post.moderation_state) && (
                    <>
                      <button
                        onClick={() => handleModerate(post.post_id, "quarantined")}
                        disabled={actingId === post.post_id}
                        className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50 transition-all"
                      >
                        Quarantine
                      </button>
                      <button
                        onClick={() => handleModerate(post.post_id, "shadow_hidden")}
                        disabled={actingId === post.post_id}
                        title="Hide from everyone except the author. The author is never told and sees no change."
                        className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                      >
                        Shadow-hide
                      </button>
                      <button
                        onClick={() => handleModerate(post.post_id, "shadow_hidden", "pet_sale")}
                        disabled={actingId === post.post_id}
                        title="Hide from everyone except the author. Unlike a plain shadow-hide, the author WILL see a 'Paltuu doesn't condone this' notice on their own copy."
                        className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                      >
                        Shadow-hide (pet sale)
                      </button>
                      <button
                        onClick={() => handleModerate(post.post_id, "hidden")}
                        disabled={actingId === post.post_id}
                        title="Hide from everyone, the author included."
                        className="text-xs px-3 py-1.5 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50 transition-all"
                      >
                        Hide
                      </button>
                    </>
                  )}
                  {(post.moderation_state === "quarantined" || post.moderation_state === "hidden" || post.moderation_state === "shadow_hidden") && (
                    <button
                      onClick={() => handleModerate(post.post_id, "none")}
                      disabled={actingId === post.post_id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-all"
                    >
                      Restore
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setOffset(o => Math.max(0, o - LIMIT))}
            disabled={offset === 0}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:border-primary disabled:opacity-30 transition-all"
          >
            ← Previous
          </button>
          <span className="text-xs text-gray-500">{offset + 1}–{Math.min(offset + LIMIT, total)} of {total}</span>
          <button
            onClick={() => setOffset(o => o + LIMIT)}
            disabled={offset + LIMIT >= total}
            className="text-sm px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:border-primary disabled:opacity-30 transition-all"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
