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
  content_notice_reason: string | null;
  has_trigger_warning: boolean;
  tags: ContentTag[];
  username: string;
  name: string;
  action_history: ActionLogEntry[];
}

type StatusFilter = "all" | "untagged" | "quarantined" | "hidden" | "shadow_hidden" | "pet_sale_review" | "pet_sale" | "trigger_warning";

type ModerationState = "none" | "quarantined" | "hidden" | "shadow_hidden";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  untagged: "Untagged",
  quarantined: "Quarantined",
  hidden: "Hidden",
  shadow_hidden: "Shadow-hidden",
  pet_sale_review: "⚠ Sale review",
  pet_sale: "All sale-flagged",
  trigger_warning: "⚠ Trigger warning",
};

const FILTER_ORDER: StatusFilter[] = [
  "all", "untagged", "pet_sale_review", "pet_sale", "trigger_warning", "quarantined", "hidden", "shadow_hidden",
];

/**
 * Whether the pet-sale flag on a post was applied by the detector rather than
 * by a person. Read off the action log the list endpoint already returns —
 * lib/moderation/petSaleDetection.ts writes `auto_flag:pet_sale` (and
 * `..._on_edit`) with a NULL admin, while a manual flag from this page writes
 * `moderate_post:notice:pet_sale` with the admin's id.
 *
 * Only used to label the row: an auto-flag is the detector's guess and still
 * wants a human verdict, a manual one has already had one. The endpoint
 * returns at most the 5 newest log entries, so on a heavily-moderated post
 * the flag can fall out of the window and this reads "manual" — the label is
 * advisory, the "needs review" state below is the one that actually gates the
 * queue.
 */
function isAutoFlagged(post: Post): boolean {
  const flagEntries = (post.action_history ?? []).filter(
    e => e.action.startsWith("auto_flag:pet_sale") || e.action.includes("notice:pet_sale"),
  );
  // action_history comes back newest-first, so the head is the flag that stands.
  return flagEntries[0]?.action.startsWith("auto_flag:pet_sale") ?? false;
}

/** Flagged but nothing has been done about it yet — mirrors the server's `pet_sale_review`. */
function needsSaleReview(post: Post): boolean {
  return post.content_notice_reason === "pet_sale"
    && (!post.moderation_state || post.moderation_state === "none");
}

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

  async function handleModerate(postId: number, state: ModerationState) {
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.map(p =>
        p.post_id === postId
          ? {
              ...p,
              moderation_state: state,
              is_hidden: state === "hidden",
              is_shadow_hidden: state === "shadow_hidden",
            }
          : p
      ));
      showToast(ACTION_TOAST[state]);
    } finally { setActingId(null); }
  }

  // Independent of moderation_state / visibility — the post stays exactly as
  // visible as it was, it just carries a public "flagged: buying or selling
  // pets" banner above its body that every viewer sees (see PostCard's
  // PetSaleNoticeBanner on the client).
  async function handleNoticeReason(postId: number, reason: "pet_sale" | null) {
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notice_reason: reason }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, content_notice_reason: reason } : p
      ));
      showToast(reason ? "Sale flag added — banner is now on the post for everyone" : "Sale flag cleared");
    } finally { setActingId(null); }
  }

  // Independent of moderation_state and of the sale flag — the post stays
  // exactly as visible as it was. When on, the mobile app blurs the post's
  // media behind a "See Post" reveal (see PostCard's TriggerWarningOverlay).
  async function handleTriggerWarning(postId: number, value: boolean) {
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trigger_warning: value }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.map(p =>
        p.post_id === postId ? { ...p, has_trigger_warning: value } : p
      ));
      showToast(value ? "Trigger warning added — media is now blurred for everyone" : "Trigger warning cleared");
    } finally { setActingId(null); }
  }

  // The verdict at the end of a sale review, in one action: confirm the flag
  // (so it stands even if the detector was what put it there) AND take the
  // post down. Both fields go in a single PATCH so the post can't be left
  // half-moderated if the second call fails, and so the action log records
  // one decision rather than two unrelated ones.
  //
  // This is the step the composer warning promises the author ("taken down
  // once a moderator confirms it"), so it should be the obvious button.
  async function handleConfirmSale(postId: number) {
    if (!confirm("Confirm this is a buying/selling post?\n\nThe post will be hidden from everyone, the author included.")) return;
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: "hidden", notice_reason: "pet_sale" }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.map(p =>
        p.post_id === postId
          ? { ...p, content_notice_reason: "pet_sale", moderation_state: "hidden", is_hidden: true, is_shadow_hidden: false }
          : p
      ));
      showToast("Confirmed as a sale post — taken down");
    } finally { setActingId(null); }
  }

  // Permanent takedown: soft-deletes the post (same path the author's own
  // delete uses — archived to Recently Deleted, hashtag/post_count upkeep,
  // dropped from feed caches) so it's gone everywhere, not just moderated.
  // Unlike moderation state this can't be undone from this page, hence the
  // harsher confirm copy.
  async function handleDelete(postId: number) {
    if (!confirm("Delete this post completely?\n\nThis removes it everywhere, the author included, and can't be undone from here.")) return;
    setActingId(postId);
    try {
      const res = await fetch(`/api/v1/admin/social/posts/${postId}`, { method: "DELETE" });
      if (!res.ok) { showToast("Failed"); return; }
      setPosts(prev => prev.filter(p => p.post_id !== postId));
      setTotal(t => Math.max(0, t - 1));
      showToast("Post deleted");
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
          {FILTER_ORDER.map(s => (
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
                    {post.content_notice_reason === "pet_sale" && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          needsSaleReview(post)
                            ? "bg-purple-600 text-white font-semibold"
                            : "bg-purple-50 text-purple-700"
                        }`}
                        title={
                          isAutoFlagged(post)
                            ? "Flagged automatically by the sale detector on post/edit."
                            : "Flagged by an admin."
                        }
                      >
                        {isAutoFlagged(post) ? "sale flag (auto)" : "sale flag"}
                        {needsSaleReview(post) ? " · needs review" : ""}
                      </span>
                    )}
                    {post.has_trigger_warning && (
                      <span
                        className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800"
                        title="Media on this post is blurred behind a 'See Post' reveal for every viewer."
                      >
                        trigger warning
                      </span>
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
                  {/* ── Sale flag ──
                       The flag itself never changes visibility; it only puts
                       the public banner on the post. Confirming a flagged
                       post is what takes it down (handleConfirmSale). ── */}
                  {post.content_notice_reason === "pet_sale" ? (
                    <>
                      {needsSaleReview(post) && (
                        <button
                          onClick={() => handleConfirmSale(post.post_id)}
                          disabled={actingId === post.post_id}
                          title="Confirm this really is a buying/selling post: keeps the flag and hides the post from everyone, the author included."
                          className="text-xs px-3 py-1.5 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-all"
                        >
                          Confirm sale → take down
                        </button>
                      )}
                      <button
                        onClick={() => handleNoticeReason(post.post_id, null)}
                        disabled={actingId === post.post_id}
                        title="False positive — remove the public sale banner. Leaves the post's visibility untouched."
                        className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                      >
                        Not a sale — clear
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleNoticeReason(post.post_id, "pet_sale")}
                      disabled={actingId === post.post_id}
                      title="Mark as a buying/selling post. The post stays fully visible, but every viewer sees a 'flagged: buying or selling pets' banner above it."
                      className="text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                    >
                      Flag: pet sale
                    </button>
                  )}
                  {/* ── Trigger warning ──
                       Blurs the post's media behind a "See Post" reveal on the
                       app. Never changes visibility; independent of the sale
                       flag and of moderation state. ── */}
                  {post.has_trigger_warning ? (
                    <button
                      onClick={() => handleTriggerWarning(post.post_id, false)}
                      disabled={actingId === post.post_id}
                      title="Remove the trigger warning — media shows normally again for everyone."
                      className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50 transition-all"
                    >
                      Clear trigger warning
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTriggerWarning(post.post_id, true)}
                      disabled={actingId === post.post_id}
                      title="Mark as a trigger warning. The post stays fully visible, but every viewer sees its media blurred behind a 'See Post' reveal."
                      className="text-xs px-3 py-1.5 rounded-lg border border-amber-300 text-amber-800 hover:bg-amber-50 disabled:opacity-50 transition-all"
                    >
                      Flag: trigger warning
                    </button>
                  )}
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
                  <button
                    onClick={() => handleDelete(post.post_id)}
                    disabled={actingId === post.post_id}
                    title="Permanently delete this post. Removes it everywhere, the author included."
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-all"
                  >
                    Delete
                  </button>
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
