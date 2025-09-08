"use client";
import React, { useEffect, useState } from "react";

type Variant = {
  variant_id: number;
  sku?: string | null;
  title?: string | null;
  attributes?: any;
  price?: number;
  stock?: number;
};

interface VariantListProps {
  productId: number;
  variants?: Variant[];
  selectedVariantId?: number;
  onSelect?: (v: Variant) => void;
}

const COLOR_MAP: Record<string, string> = {
  red: "bg-red-500",
  blue: "bg-blue-500",
  green: "bg-green-500",
  black: "bg-black",
  white: "bg-white",
  yellow: "bg-yellow-400",
  orange: "bg-orange-400",
  purple: "bg-gray-200",
  pink: "bg-pink-400",
  gray: "bg-gray-400",
};

function parseAttributes(v: Variant): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const attrs = v.attributes;
  if (!attrs) return out;

  if (Array.isArray(attrs)) {
    for (const a of attrs) {
      if (typeof a === "string") {
        const parts = a.split(/[:=\\-]/).map((s) => s.trim());
        if (parts.length >= 2) out.push({ label: parts[0], value: parts.slice(1).join(": ") });
        else out.push({ label: "", value: a });
      } else if (a && typeof a === "object") {
        const name = a.name || a.label || Object.keys(a)[0] || "";
        const val = a.value ?? a.val ?? a[Object.keys(a)[0]] ?? "";
        out.push({ label: name, value: String(val) });
      }
    }
    return out;
  }

  if (typeof attrs === "object") {
    for (const k of Object.keys(attrs)) {
      out.push({ label: k, value: String((attrs as any)[k]) });
    }
    return out;
  }

  if (typeof attrs === "string") {
    const parts = attrs.split(/[,;|]/).map((s) => s.trim());
    for (const p of parts) {
      const kv = p.split(/[:=\\-]/).map((s) => s.trim());
      if (kv.length >= 2) out.push({ label: kv[0], value: kv.slice(1).join(": ") });
      else out.push({ label: "", value: p });
    }
  }

  return out;
}

export default function VariantList({ productId, variants: initialVariants, selectedVariantId, onSelect }: VariantListProps) {
  const [variants, setVariants] = useState<Variant[] | undefined>(initialVariants);
  const [selectedId, setSelectedId] = useState<number | undefined>(selectedVariantId);

  useEffect(() => {
    setSelectedId(selectedVariantId);
  }, [selectedVariantId]);

  useEffect(() => {
    if (initialVariants) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/bazaar/products/${productId}`);
        if (!res.ok) return;
        const data = await res.json();
        const vs = data?.variants ?? data?.product?.variants ?? data;
        if (mounted && Array.isArray(vs)) setVariants(vs);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, [productId, initialVariants]);

  function handleSelect(v: Variant) {
    setSelectedId(v.variant_id);
    onSelect?.(v);
  }

  if (!variants || variants.length === 0) return null;

  return (
    <ul className="grid grid-cols-2 gap-4">
      {variants.map((v) => {
        const attrs = parseAttributes(v);
        const parts = attrs.map((a) => (a.label ? `${a.label}: ${a.value}` : a.value)).filter(Boolean);
        const uniqueParts = Array.from(new Set(parts));
        // prefer color to appear first
        const sortedParts = uniqueParts.sort((a, b) => {
          const aLower = a.toLowerCase();
          const bLower = b.toLowerCase();
          const aIsColor = aLower.startsWith("color");
          const bIsColor = bLower.startsWith("color");
          if (aIsColor && !bIsColor) return -1;
          if (!aIsColor && bIsColor) return 1;
          return 0;
        });
        const attrDisplay = sortedParts.length > 0 ? sortedParts.join(" • ") : v.title ?? `Variant ${v.variant_id}`;
        const isSelected = selectedId === v.variant_id;

        return (
          <li key={v.variant_id}>
            <button
              type="button"
              onClick={() => handleSelect(v)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleSelect(v);
                }
              }}
              className={`w-full text-left p-4 rounded-xl transition transform ${isSelected ? "ring-2 ring-offset-1 ring-indigo-200" : ""} bg-gray-50 dark:bg-gray-800 hover:shadow-md`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-tight text-gray-800 dark:text-gray-100 font-medium break-words">{attrDisplay}</div>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
