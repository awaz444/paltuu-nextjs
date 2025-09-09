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

function parseAttributes(v: Variant): { label: string; value: string }[] {
  const out: { label: string; value: string }[] = [];
  const attrs = v.attributes;
  if (!attrs) return out;

  if (Array.isArray(attrs)) {
    for (const a of attrs) {
      if (typeof a === "string") {
        const parts = a.split(/[:=\\-]/).map((s) => s.trim());
        if (parts.length >= 2)
          out.push({ label: parts[0], value: parts.slice(1).join(": ") });
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
      if (kv.length >= 2)
        out.push({ label: kv[0], value: kv.slice(1).join(": ") });
      else out.push({ label: "", value: p });
    }
  }

  return out;
}

export default function VariantList({
  productId,
  variants: initialVariants,
  selectedVariantId,
  onSelect,
}: VariantListProps) {
  const [variants, setVariants] = useState<Variant[] | undefined>(
    initialVariants
  );
  const [selectedId, setSelectedId] = useState<number | undefined>(
    selectedVariantId
  );
  const [isLoading, setIsLoading] = useState(!initialVariants);

  useEffect(() => {
    setSelectedId(selectedVariantId);
  }, [selectedVariantId]);

  useEffect(() => {
    if (initialVariants) return;
    
    let mounted = true;
    setIsLoading(true);
    
    (async () => {
      try {
        const res = await fetch(`/api/bazaar/products/${productId}`);
        if (!res.ok) return;
        const data = await res.json();
        const vs = data?.variants ?? data?.product?.variants ?? data;
        if (mounted && Array.isArray(vs)) setVariants(vs);
      } catch (err) {
        console.error("Failed to fetch variants:", err);
      } finally {
        if (mounted) setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-20 bg-gray-100 rounded-xl animate-pulse"
          ></div>
        ))}
      </div>
    );
  }

  if (!variants || variants.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No variants available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-medium text-gray-700">Select Option:</h3>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {variants.map((v) => {
          const attrs = parseAttributes(v);
          const parts = attrs
            .map((a) => (a.label ? `${a.label}: ${a.value}` : a.value))
            .filter(Boolean);
          const uniqueParts = Array.from(new Set(parts));

          // Prefer color to appear first
          const sortedParts = uniqueParts.sort((a, b) => {
            const aLower = a.toLowerCase();
            const bLower = b.toLowerCase();
            const aIsColor = aLower.startsWith("color");
            const bIsColor = bLower.startsWith("color");
            if (aIsColor && !bIsColor) return -1;
            if (!aIsColor && bIsColor) return 1;
            return 0;
          });

          const attrDisplay =
            sortedParts.length > 0
              ? sortedParts.join(" • ")
              : v.title ?? `Variant ${v.variant_id}`;
          const isSelected = selectedId === v.variant_id;
          const isOutOfStock = v.stock !== undefined && v.stock <= 0;

          return (
            <li key={v.variant_id}>
              <button
                type="button"
                onClick={() => !isOutOfStock && handleSelect(v)}
                onKeyDown={(e) => {
                  if ((e.key === "Enter" || e.key === " ") && !isOutOfStock) {
                    e.preventDefault();
                    handleSelect(v);
                  }
                }}
                disabled={isOutOfStock}
                aria-pressed={isSelected}
                aria-label={`Select ${attrDisplay}${isOutOfStock ? ' - Out of stock' : ''}`}
                className={`w-full text-left p-4 rounded-xl transition-all duration-200 ease-in-out
                  ${isSelected
                    ? "bg-[#a03048] text-white ring-2 ring-[#a03048] ring-opacity-50 shadow-md"
                    : "bg-white text-gray-800 border border-gray-200 hover:border-[#a03048] hover:shadow-md"
                  }
                  ${isOutOfStock
                    ? "opacity-50 cursor-not-allowed grayscale"
                    : "cursor-pointer hover:-translate-y-0.5"
                  }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium break-words">
                      {attrDisplay}
                    </div>
                    {v.price !== undefined && (
                      <div className={`text-xs mt-1 ${isSelected ? "text-white" : "text-gray-500"}`}>
                        ${v.price.toFixed(2)}
                      </div>
                    )}
                  </div>
                  {isSelected && (
                    <div className="ml-2 flex-shrink-0">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                {isOutOfStock && (
                  <div className="text-xs mt-1 italic">
                    Out of stock
                  </div>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}