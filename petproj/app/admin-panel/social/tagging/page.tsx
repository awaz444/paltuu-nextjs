"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface MediaItem { url: string; media_type: string; }
interface Post {
  post_id: number;
  content: string;
  post_type: string;
  created_at: string;
  hours_untagged: number;
  media: MediaItem[];
  report_count: number;
  hashtags: string[];
}
interface Tag { tag_id: number; slug: string; label: string; category: string; is_active: boolean; description: string | null; }
interface TagCategories { species: Tag[]; topic: Tag[]; content_type: Tag[]; mood: Tag[]; }

type Filter = "recent" | "all" | "media" | "text" | "sla_breach";

export default function TaggingQueuePage() {
  const { user, isHydrating } = useAuth();
  const router = useRouter();

  const [posts, setPosts] = useState<Post[]>([]);
  const [index, setIndex] = useState(0);
  const [totalUntagged, setTotalUntagged] = useState(0);
  // Untagged posts still inside the 72h engagement-backfill window — the ones
  // worth working. `totalUntagged` includes the engagement-lost backlog too.
  const [totalRecoverable, setTotalRecoverable] = useState(0);
  const [tags, setTags] = useState<TagCategories>({ species: [], topic: [], content_type: [], mood: [] });
  const [selectedPrimary, setSelectedPrimary] = useState<number[]>([]);
  const [selectedSecondary, setSelectedSecondary] = useState<number[]>([]);
  const [filter, setFilter] = useState<Filter>("recent");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showCreateTag, setShowCreateTag] = useState(false);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagCategory, setNewTagCategory] = useState("species");
  const [newTagDescription, setNewTagDescription] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function matchHashtagToTag(hashtag: string): Tag | undefined {
    const needle = hashtag.toLowerCase();
    const allTags = Object.values(tags).flat();
    return (
      allTags.find(t => t.slug === needle) ??
      allTags.find(t => t.label.toLowerCase() === needle) ??
      allTags.find(t => t.slug.includes(needle) || needle.includes(t.slug))
    );
  }

  function handleHashtagClick(hashtag: string) {
    const match = matchHashtagToTag(hashtag);
    if (!match) { showToast(`No matching tag for #${hashtag}`); return; }
    if (selectedPrimary.includes(match.tag_id)) { showToast(`"${match.label}" already selected`); return; }
    if (selectedPrimary.length >= 3) { showToast("Max 3 primary tags"); return; }
    setSelectedPrimary(prev => [...prev, match.tag_id]);
    showToast(`"${match.label}" pre-selected as primary`);
  }

  useEffect(() => {
    if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
  }, [user, isHydrating, router]);

  const fetchQueue = useCallback(async (f: Filter) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/social/tagging-queue?limit=100&filter=${f}`);
      const data = await res.json();
      setPosts(data.posts ?? []);
      setTotalUntagged(data.total_untagged ?? 0);
      setTotalRecoverable(data.total_recoverable ?? 0);
      setIndex(0);
      setSelectedPrimary([]);
      setSelectedSecondary([]);
    } catch { showToast("Failed to load queue"); }
    finally { setLoading(false); }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/admin/social/content-tags");
      const data = await res.json();
      setTags(data.categories ?? { species: [], topic: [], content_type: [], mood: [] });
    } catch { showToast("Failed to load tags"); }
  }, []);

  useEffect(() => {
    fetchQueue(filter);
    fetchTags();
  }, []);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function togglePrimary(tagId: number) {
    setSelectedPrimary(prev => {
      if (prev.includes(tagId)) return prev.filter(id => id !== tagId);
      if (prev.length >= 3) { showToast("Max 3 primary tags"); return prev; }
      return [...prev, tagId];
    });
  }

  function toggleSecondary(tagId: number) {
    setSelectedSecondary(prev =>
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  }

  function advance() {
    setSelectedPrimary([]);
    setSelectedSecondary([]);
    setIndex(i => i + 1);
  }

  async function handleSave() {
    if (selectedPrimary.length === 0) { showToast("Pick at least 1 primary tag"); return; }
    const post = posts[index];
    setSaving(true);
    try {
      const tags = [
        ...selectedPrimary.map(id => ({ tag_id: id, role: "primary" as const })),
        ...selectedSecondary.map(id => ({ tag_id: id, role: "secondary" as const })),
      ];
      const res = await fetch(`/api/v1/admin/social/posts/${post.post_id}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tags }),
      });
      if (!res.ok) { showToast("Failed to save tags"); return; }
      setTotalUntagged(n => Math.max(0, n - 1));
      if (post.hours_untagged <= 72) setTotalRecoverable(n => Math.max(0, n - 1));
      showToast("Tagged!");
      advance();
    } finally { setSaving(false); }
  }

  async function handleReject() {
    if (!confirm("Hide this post?")) return;
    const post = posts[index];
    setSaving(true);
    try {
      await fetch(`/api/v1/admin/social/posts/${post.post_id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "admin_rejected" }),
      });
      setTotalUntagged(n => Math.max(0, n - 1));
      if (post.hours_untagged <= 72) setTotalRecoverable(n => Math.max(0, n - 1));
      showToast("Post rejected");
      advance();
    } finally { setSaving(false); }
  }

  async function handleCreateTag() {
    if (!newTagLabel.trim()) return;
    setCreatingTag(true);
    try {
      const res = await fetch("/api/v1/admin/social/content-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newTagLabel.trim(), category: newTagCategory, description: newTagDescription.trim() }),
      });
      if (!res.ok) { showToast("Tag already exists or error"); return; }
      const newTag = await res.json();
      setTags(prev => ({
        ...prev,
        [newTagCategory]: [...(prev[newTagCategory as keyof TagCategories] ?? []), newTag],
      }));
      setNewTagLabel("");
      setNewTagDescription("");
      setShowCreateTag(false);
      showToast(`Tag "${newTag.label}" created`);
    } finally { setCreatingTag(false); }
  }

  async function changeFilter(f: Filter) {
    setFilter(f);
    await fetchQueue(f);
  }

  if (isHydrating || loading) {
    return <div className="flex justify-center items-center h-screen"><div className="loader" /></div>;
  }

  if (!user || user.role !== "admin") {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600">Unauthorized</p></div>;
  }

  const post = posts[index];
  const allTags = Object.values(tags).flat();

  const CATEGORY_LABELS: Record<string, string> = {
    species: "Species",
    topic: "Topic",
    content_type: "Content Type",
    mood: "Mood",
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
          <h1 className="text-xl font-bold text-primary">Tagging Queue</h1>
          <span
            className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full"
            title="Untagged posts still inside the 72h engagement-backfill window — the ones worth tagging now."
          >
            {totalRecoverable} recent
          </span>
          {totalUntagged > totalRecoverable && (
            <span
              className="text-xs text-gray-400"
              title="Total untagged including posts past the 72h window. Use the 'All' filter to work these; their engagement signal is already lost."
            >
              +{totalUntagged - totalRecoverable} engagement-lost
            </span>
          )}
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {(["recent", "all", "media", "text", "sla_breach"] as Filter[]).map(f => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              title={
                f === "recent" ? "Only posts still inside the 72h engagement-backfill window (default)."
                : f === "all" ? "Every untagged post, including ones whose engagement signal is already lost."
                : undefined
              }
              className={`text-xs px-3 py-1 rounded-full border transition-all ${
                filter === f ? "bg-primary text-white border-primary" : "bg-white text-gray-600 border-gray-300 hover:border-primary"
              }`}
            >
              {f === "sla_breach" ? "⚠ SLA breach"
                : f === "recent" ? "Recent (<72h)"
                : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
          <button
            onClick={() => setShowGuide(v => !v)}
            className={`text-xs px-3 py-1 rounded-full border transition-all ${
              showGuide ? "bg-primary text-white border-primary" : "bg-white text-primary border-primary/40 hover:border-primary"
            }`}
          >
            {showGuide ? "✕ Hide guide" : "📋 Tagging guide"}
          </button>
        </div>
      </div>

      {/* Best-practices guide — collapsible reference for anyone tagging */}
      {showGuide && (
        <div className="bg-white rounded-lg shadow border border-gray-200 mb-6 p-5 max-w-4xl">
          <h2 className="font-semibold text-gray-800 mb-3">Tagging Best Practices</h2>
          <ul className="text-sm text-gray-600 space-y-2.5 list-disc list-inside">
            <li>
              <strong>Tag within 4 hours, and never later than 72.</strong> Engagement (likes, saves, comments,
              reposts) on an untagged post is queued, not scored. When you tag the post, only engagement from
              roughly the last 72 hours is replayed into interest scores — anything older is discarded permanently,
              and the queue is cleared either way. Work the <em>⚠ SLA breach</em> filter first; treat 72h as the
              point of no return, not a soft deadline.
            </li>
            <li>
              <strong>Only Primary tags affect the feed.</strong> Secondary tags are organizational metadata only —
              they don't feed personalization at all. Put the tag you want the algorithm to learn from in Primary.
            </li>
            <li>
              <strong>Never use more than 3 Primary tags.</strong> A post with 4+ primary tags gets{" "}
              <em>zero</em> personalization affinity — it silently falls out of scoring entirely, which is worse
              than a single tag. Prefer 1–2 precise primary tags over 3 loose ones.
            </li>
            <li>
              <strong>Consistency beats precision.</strong> The score for a tag only becomes meaningful once it's
              applied the same way across many similar posts. Hover any tag chip for its rubric, and when in doubt,
              tag it the way the rubric says — not by vibes.
            </li>
            <li>
              <strong>Don't tag obvious/derivable properties.</strong> Photo/Video/Text tags were retired because
              they're already implied by the post itself and don't discriminate between users — nearly every post is
              a photo. If a property is already true of almost everything, it isn't a useful interest signal.
            </li>
            <li>
              Full rubric for every tag is in{" "}
              <Link href="/admin-panel/social/tags" className="text-primary hover:underline">Tag Taxonomy</Link>{" "}
              — that's also where to add missing keyword aliases so hashtags auto-suggest the right primary tag.
            </li>
          </ul>
        </div>
      )}

      {/* Empty state */}
      {posts.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg font-medium">Queue is empty</p>
          <p className="text-sm mt-1">All posts are tagged for this filter.</p>
        </div>
      )}

      {/* Done with current batch */}
      {posts.length > 0 && index >= posts.length && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-500">
          <p className="text-lg font-medium">Batch complete</p>
          <p className="text-sm mt-1">
            {filter === "all"
              ? (totalUntagged > 0 ? `${totalUntagged} untagged posts still remain.` : "All caught up!")
              : (totalRecoverable > 0
                  ? `${totalRecoverable} recent posts still remain.`
                  : totalUntagged > 0
                    ? "All recent posts done — only engagement-lost ones remain (see the All filter)."
                    : "All caught up!")}
          </p>
          <button onClick={() => fetchQueue(filter)} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg text-sm">
            Reload queue
          </button>
        </div>
      )}

      {/* Main tagging UI */}
      {post && index < posts.length && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Post preview */}
          <div className="bg-white rounded-lg shadow-lg p-5 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-500">
                Post #{post.post_id} · {Math.round(post.hours_untagged)}h ago
              </span>
              <div className="flex gap-2">
                {post.hours_untagged > 72 && (
                  <span
                    className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full"
                    title="Past the 72h backfill window — engagement on this post can no longer be recovered into interest scores. Tag it anyway for future ranking, but the historical signal is gone."
                  >
                    🔴 Engagement lost (&gt;72h)
                  </span>
                )}
                {post.hours_untagged > 24 && post.hours_untagged <= 72 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Critical — tag now</span>
                )}
                {post.hours_untagged > 4 && post.hours_untagged <= 24 && (
                  <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">⚠ SLA breach</span>
                )}
                {post.report_count > 0 && (
                  <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{post.report_count} reports</span>
                )}
              </div>
            </div>

            {/* Media */}
            {post.media.length > 0 && (
              <div className="mb-4 rounded-lg overflow-hidden bg-gray-100 max-h-72 flex items-center justify-center">
                {post.media[0].media_type === "video" ? (
                  <video src={post.media[0].url} controls className="max-h-72 w-full object-contain" />
                ) : (
                  <img src={post.media[0].url} alt="Post" className="max-h-72 w-full object-contain" />
                )}
              </div>
            )}

            {/* Caption */}
            {post.content && (
              <p className="text-sm text-gray-800 mb-3 leading-relaxed">{post.content}</p>
            )}

            {/* Hashtag hints — click to pre-select matching tag */}
            {post.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                <span className="text-xs text-gray-400 self-center">Hashtags:</span>
                {post.hashtags.map(h => {
                  const match = matchHashtagToTag(h);
                  const alreadySelected = match && selectedPrimary.includes(match.tag_id);
                  return (
                    <button
                      key={h}
                      onClick={() => handleHashtagClick(h)}
                      title={match ? `Click to select "${match.label}"` : "No matching tag"}
                      className={`text-xs px-2 py-0.5 rounded-full transition-all ${
                        alreadySelected
                          ? "bg-primary text-white"
                          : match
                          ? "bg-gray-100 text-gray-700 hover:bg-primary/10 hover:text-primary cursor-pointer"
                          : "bg-gray-100 text-gray-400 cursor-default"
                      }`}
                    >
                      #{h}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => { setIndex(i => Math.max(0, i - 1)); setSelectedPrimary([]); setSelectedSecondary([]); }}
                disabled={index === 0}
                className="text-xs text-gray-500 hover:text-primary disabled:opacity-30"
              >
                ← Previous
              </button>
              <span className="text-xs text-gray-400">{index + 1} of {posts.length} in batch</span>
              <button
                onClick={advance}
                className="text-xs text-gray-500 hover:text-primary"
              >
                Skip →
              </button>
            </div>
          </div>

          {/* Right: Tag picker */}
          <div className="bg-white rounded-lg shadow-lg p-5 border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">Select Tags</h3>

            {/* Primary */}
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Primary tags <span className="text-gray-400">(1–3 required · drives feed ranking)</span>
              </p>
              {(["species", "topic", "content_type", "mood"] as (keyof TagCategories)[]).map(cat => {
                const catTags = tags[cat].filter(t => t.is_active);
                if (catTags.length === 0) return null;
                return (
                  <div key={cat} className="mb-3">
                    <p className="text-xs text-gray-400 mb-1">{CATEGORY_LABELS[cat]}</p>
                    <div className="flex flex-wrap gap-2">
                      {catTags.map(t => (
                        <button
                          key={t.tag_id}
                          onClick={() => togglePrimary(t.tag_id)}
                          title={t.description ?? "No rubric set for this tag yet."}
                          className={`text-xs px-3 py-1 rounded-full border transition-all ${
                            selectedPrimary.includes(t.tag_id)
                              ? "bg-primary text-white border-primary"
                              : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Secondary */}
            <div className="mb-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                Secondary tags <span className="text-gray-400">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {allTags.filter(t => t.is_active && !selectedPrimary.includes(t.tag_id)).map(t => (
                  <label key={t.tag_id} title={t.description ?? "No rubric set for this tag yet."} className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedSecondary.includes(t.tag_id)}
                      onChange={() => toggleSecondary(t.tag_id)}
                      className="accent-primary"
                    />
                    <span className="text-xs text-gray-600">{t.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Create new tag */}
            {!showCreateTag ? (
              <button onClick={() => setShowCreateTag(true)} className="text-xs text-primary hover:underline mb-4">
                + Create new tag
              </button>
            ) : (
              <div className="border border-gray-200 rounded-lg p-3 mb-4 bg-gray-50">
                <p className="text-xs font-medium text-gray-600 mb-2">New tag</p>
                <p className="text-xs text-amber-600 mb-2">
                  Consider first whether an existing tag covers this — more tags fragment interest scoring at low
                  post volume (see the Tagging guide above).
                </p>
                <input
                  value={newTagLabel}
                  onChange={e => setNewTagLabel(e.target.value)}
                  placeholder="Label (e.g. Hamster)"
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-1 focus:outline-none focus:border-primary"
                />
                {newTagLabel && (
                  <p className="text-xs text-gray-400 mb-2">slug: <span className="font-mono text-gray-600">{slugify(newTagLabel)}</span></p>
                )}
                <select
                  value={newTagCategory}
                  onChange={e => setNewTagCategory(e.target.value)}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:border-primary"
                >
                  <option value="species">Species</option>
                  <option value="topic">Topic</option>
                  <option value="content_type">Content Type</option>
                  <option value="mood">Mood</option>
                </select>
                <textarea
                  value={newTagDescription}
                  onChange={e => setNewTagDescription(e.target.value)}
                  placeholder="Rubric — one precise sentence so every admin tags it the same way"
                  rows={2}
                  className="w-full text-xs border border-gray-300 rounded px-2 py-1 mb-2 focus:outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCreateTag}
                    disabled={creatingTag || !newTagLabel.trim()}
                    className="text-xs bg-primary text-white px-3 py-1 rounded disabled:opacity-50"
                  >
                    {creatingTag ? "Creating..." : "Create"}
                  </button>
                  <button onClick={() => { setShowCreateTag(false); setNewTagLabel(""); setNewTagDescription(""); }} className="text-xs text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={saving || selectedPrimary.length === 0}
                className="flex-1 bg-primary text-white text-sm py-2 rounded-lg font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving..." : "Save Tags"}
              </button>
              <button
                onClick={handleReject}
                disabled={saving}
                className="px-4 text-sm py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition-all"
              >
                Reject
              </button>
              <button
                onClick={advance}
                className="px-4 text-sm py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
              >
                Skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
