"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface Tag {
  tag_id: number;
  slug: string;
  label: string;
  category: string;
  default_weight: number;
  keyword_aliases: string[];
  is_active: boolean;
  sort_order: number;
}

interface TagCategories { species: Tag[]; topic: Tag[]; content_type: Tag[]; mood: Tag[]; }

const CATEGORY_LABELS: Record<string, string> = {
  species: "Species",
  topic: "Topic",
  content_type: "Content Type",
  mood: "Mood",
};

export default function TagTaxonomyPage() {
  const { user, isHydrating } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState<TagCategories>({ species: [], topic: [], content_type: [], mood: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editAliases, setEditAliases] = useState("");
  const [editWeight, setEditWeight] = useState("1.0");
  const [saving, setSaving] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [newCategory, setNewCategory] = useState("species");
  const [newAliases, setNewAliases] = useState("");
  const [creating, setCreating] = useState(false);

  function slugify(str: string) {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function handleNewLabelChange(val: string) {
    setNewLabel(val);
    setNewSlug(slugify(val));
  }

  useEffect(() => {
    if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
  }, [user, isHydrating, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/admin/social/content-tags");
      const data = await res.json();
      setCategories(data.categories ?? { species: [], topic: [], content_type: [], mood: [] });
    } catch { showToast("Failed to load tags"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  function startEdit(tag: Tag) {
    setEditingId(tag.tag_id);
    setEditLabel(tag.label);
    setEditAliases((tag.keyword_aliases ?? []).join(", "));
    setEditWeight(String(tag.default_weight ?? 1.0));
  }

  function cancelEdit() {
    setEditingId(null);
    setEditLabel("");
    setEditAliases("");
    setEditWeight("1.0");
  }

  async function saveEdit(tag: Tag) {
    setSaving(true);
    try {
      const aliases = editAliases.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch(`/api/v1/admin/social/content-tags/${tag.tag_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: editLabel.trim(),
          keyword_aliases: aliases,
          default_weight: parseFloat(editWeight) || 1.0,
        }),
      });
      if (!res.ok) { showToast("Failed to save"); return; }
      const updated = await res.json();
      setCategories(prev => {
        const cat = tag.category as keyof TagCategories;
        return { ...prev, [cat]: prev[cat].map(t => t.tag_id === tag.tag_id ? { ...t, ...updated } : t) };
      });
      cancelEdit();
      showToast("Saved");
    } finally { setSaving(false); }
  }

  async function toggleActive(tag: Tag) {
    try {
      const res = await fetch(`/api/v1/admin/social/content-tags/${tag.tag_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !tag.is_active }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setCategories(prev => {
        const cat = tag.category as keyof TagCategories;
        return { ...prev, [cat]: prev[cat].map(t => t.tag_id === tag.tag_id ? { ...t, is_active: !tag.is_active } : t) };
      });
      showToast(tag.is_active ? "Tag deactivated" : "Tag activated");
    } catch { showToast("Failed"); }
  }

  async function handleCreate() {
    if (!newLabel.trim()) return;
    setCreating(true);
    try {
      const aliases = newAliases.split(",").map(s => s.trim()).filter(Boolean);
      const res = await fetch("/api/v1/admin/social/content-tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: newLabel.trim(), slug: newSlug.trim() || slugify(newLabel), category: newCategory, keyword_aliases: aliases }),
      });
      if (!res.ok) {
        const err = await res.json();
        showToast(err.error ?? "Failed to create");
        return;
      }
      const newTag = await res.json();
      setCategories(prev => ({
        ...prev,
        [newCategory]: [...(prev[newCategory as keyof TagCategories] ?? []), newTag],
      }));
      setNewLabel(""); setNewSlug(""); setNewAliases(""); setShowCreate(false);
      showToast(`"${newTag.label}" created`);
    } finally { setCreating(false); }
  }

  if (isHydrating || loading) {
    return <div className="flex justify-center items-center h-screen"><div className="loader" /></div>;
  }
  if (!user || user.role !== "admin") {
    return <div className="flex justify-center items-center h-screen"><p className="text-red-600">Unauthorized</p></div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen px-4 sm:px-6 lg:px-8 py-8">
      {toast && (
        <div className="fixed top-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg z-50 text-sm">{toast}</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
          <h1 className="text-xl font-bold text-primary">Tag Taxonomy</h1>
        </div>
        <button
          onClick={() => setShowCreate(v => !v)}
          className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
        >
          + New Tag
        </button>
      </div>

      {/* Create new tag */}
      {showCreate && (
        <div className="bg-white rounded-lg shadow-lg p-5 border border-primary mb-6 max-w-lg">
          <h3 className="font-semibold text-gray-800 mb-4">Create New Tag</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Label <span className="text-red-400">*</span></label>
              <input
                value={newLabel}
                onChange={e => handleNewLabelChange(e.target.value)}
                placeholder="e.g. Hamster"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Slug <span className="text-gray-400">(auto-generated, editable)</span></label>
              <input
                value={newSlug}
                onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="e.g. hamster"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 font-mono focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Category <span className="text-red-400">*</span></label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              >
                <option value="species">Species</option>
                <option value="topic">Topic</option>
                <option value="content_type">Content Type</option>
                <option value="mood">Mood</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Keyword aliases (comma-separated)</label>
              <input
                value={newAliases}
                onChange={e => setNewAliases(e.target.value)}
                placeholder="e.g. hamsters, hammy"
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={creating || !newLabel.trim()}
                className="bg-primary text-white text-sm px-4 py-2 rounded-lg disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Tag"}
              </button>
              <button onClick={() => { setShowCreate(false); setNewLabel(""); setNewSlug(""); setNewAliases(""); }} className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags by category */}
      <div className="space-y-6">
        {(Object.keys(categories) as (keyof TagCategories)[]).map(cat => {
          const catTags = categories[cat];
          if (catTags.length === 0) return null;
          return (
            <div key={cat} className="bg-white rounded-lg shadow-lg p-5 border border-gray-200">
              <h2 className="font-semibold text-primary mb-4">{CATEGORY_LABELS[cat]}</h2>
              <div className="space-y-2">
                {catTags.map(tag => (
                  <div
                    key={tag.tag_id}
                    className={`border rounded-lg p-3 transition-all ${tag.is_active ? "border-gray-200" : "border-gray-100 bg-gray-50 opacity-60"}`}
                  >
                    {editingId === tag.tag_id ? (
                      <div className="space-y-2">
                        <input
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary"
                        />
                        <input
                          value={editAliases}
                          onChange={e => setEditAliases(e.target.value)}
                          placeholder="Aliases (comma-separated)"
                          className="w-full text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary"
                        />
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-500">Weight:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={e => setEditWeight(e.target.value)}
                            className="w-20 text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => saveEdit(tag)} disabled={saving} className="text-xs bg-primary text-white px-3 py-1 rounded disabled:opacity-50">
                            {saving ? "Saving..." : "Save"}
                          </button>
                          <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-gray-800">{tag.label}</span>
                          <span className="text-xs text-gray-400 ml-2">/{tag.slug}</span>
                          {tag.keyword_aliases?.length > 0 && (
                            <span className="text-xs text-gray-400 ml-2">· aliases: {tag.keyword_aliases.join(", ")}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-400">w:{tag.default_weight}</span>
                          <button onClick={() => startEdit(tag)} className="text-xs text-primary hover:underline">edit</button>
                          <button
                            onClick={() => toggleActive(tag)}
                            className={`text-xs px-2 py-0.5 rounded border transition-all ${
                              tag.is_active
                                ? "border-gray-300 text-gray-500 hover:border-red-300 hover:text-red-500"
                                : "border-green-300 text-green-600 hover:bg-green-50"
                            }`}
                          >
                            {tag.is_active ? "deactivate" : "activate"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
