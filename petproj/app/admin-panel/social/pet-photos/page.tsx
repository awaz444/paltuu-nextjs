"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

interface PetPhoto {
  photo_id: number;
  pet_profile_id: number;
  photo_url: string;
  caption: string | null;
  is_shadow_hidden: boolean;
  created_at: string;
  pet_name: string;
  species: string | null;
  owner_id: number;
  owner_name: string | null;
  owner_username: string | null;
}

type StatusFilter = "all" | "shadow_hidden";

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  shadow_hidden: "Shadow-hidden",
};

export default function PetPhotoBrowserPage() {
  const { user, isHydrating } = useAuth();
  const router = useRouter();

  const [photos, setPhotos] = useState<PetPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);
  const searchRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const LIMIT = 24;

  useEffect(() => {
    if (!isHydrating && user && user.role !== "admin") router.push("/browse-pets");
  }, [user, isHydrating, router]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  const fetchPhotos = useCallback(async (q: string, status: StatusFilter, off: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(LIMIT),
        offset: String(off),
        ...(q ? { search: q } : {}),
        ...(status !== "all" ? { status } : {}),
      });
      const res = await fetch(`/api/v1/admin/social/pet-photos?${params}`);
      const data = await res.json();
      setPhotos(data.photos ?? []);
      setTotal(data.total ?? 0);
    } catch { showToast("Failed to load photos"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchPhotos(search, statusFilter, offset);
  }, [statusFilter, offset]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setSearch(q);
    setOffset(0);
    if (searchRef.current) clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => fetchPhotos(q, statusFilter, 0), 400);
  }

  async function handleModerate(photoId: number, shadowHidden: boolean) {
    setActingId(photoId);
    try {
      const res = await fetch(`/api/v1/admin/social/pet-photos/${photoId}/moderate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shadow_hidden: shadowHidden }),
      });
      if (!res.ok) { showToast("Failed"); return; }
      setPhotos(prev => prev.map(p =>
        p.photo_id === photoId ? { ...p, is_shadow_hidden: shadowHidden } : p
      ));
      showToast(shadowHidden ? "Shadow-hidden — still visible to the owner only" : "Restored");
    } finally { setActingId(null); }
  }

  if (isHydrating) {
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
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-3">
          <Link href="/admin-panel" className="text-gray-500 hover:text-primary text-sm">← Admin Panel</Link>
          <h1 className="text-xl font-bold text-primary">Pet Photo Browser</h1>
          {total > 0 && <span className="text-xs text-gray-400">{total} photos</span>}
        </div>
      </div>
      <p className="text-xs text-gray-500 mb-6">
        Shadow-hiding a polaroid removes it from every other viewer&apos;s gallery. The owner keeps
        seeing it exactly as before and is never notified.
      </p>

      {/* Search + filters */}
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 mb-5 flex flex-wrap gap-3 items-center">
        <input
          value={search}
          onChange={handleSearchChange}
          placeholder="Search by pet name, caption, owner or @username..."
          className="flex-1 min-w-48 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
        />
        <div className="flex gap-2 flex-wrap">
          {(["all", "shadow_hidden"] as StatusFilter[]).map(s => (
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

      {/* Photo grid */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden p-4">
        {loading ? (
          <div className="flex justify-center items-center h-48"><div className="loader" /></div>
        ) : photos.length === 0 ? (
          <div className="text-center py-16 text-gray-500 text-sm">No photos found</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map(photo => (
              <div key={photo.photo_id} className="border border-gray-200 rounded-lg overflow-hidden flex flex-col">
                <div className="relative bg-gray-100 aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.photo_url}
                    alt={photo.caption ?? photo.pet_name}
                    className="w-full h-full object-cover"
                  />
                  {photo.is_shadow_hidden && (
                    <span className="absolute top-2 right-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                      shadow-hidden
                    </span>
                  )}
                </div>

                <div className="p-3 flex-1 flex flex-col gap-1">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-xs text-gray-400">#{photo.photo_id}</span>
                    <span className="text-sm font-semibold text-gray-800">{photo.pet_name}</span>
                  </div>
                  {photo.owner_username && (
                    <span className="text-xs text-gray-500">@{photo.owner_username}</span>
                  )}
                  <p className="text-xs text-gray-600 line-clamp-2">{photo.caption || "(no caption)"}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(photo.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="p-3 pt-0">
                  {photo.is_shadow_hidden ? (
                    <button
                      onClick={() => handleModerate(photo.photo_id, false)}
                      disabled={actingId === photo.photo_id}
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-green-300 text-green-700 hover:bg-green-50 disabled:opacity-50 transition-all"
                    >
                      Restore
                    </button>
                  ) : (
                    <button
                      onClick={() => handleModerate(photo.photo_id, true)}
                      disabled={actingId === photo.photo_id}
                      title="Hide from everyone except the owner. The owner is never told and sees no change."
                      className="w-full text-xs px-3 py-1.5 rounded-lg border border-purple-300 text-purple-700 hover:bg-purple-50 disabled:opacity-50 transition-all"
                    >
                      Shadow-hide
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
