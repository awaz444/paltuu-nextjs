"use client";

import React from "react";
import Link from "next/link";
import ProductGrid from "@/components/ProductGrid";

export default function CategoryProductsClient({
  category,
  initialProducts,
}: {
  category: string;
  initialProducts: any[];
}) {
  return (
    <div>
      {/* Bazaar paused notice */}
      <div className="bg-amber-50 border-b border-amber-200 py-3 px-4 text-center mb-6">
        <p className="text-amber-800 text-sm font-medium">
          🚧 Paltuu Bazaar is temporarily paused while we upgrade our shopping experience.
          Browse products below — ordering will be back soon.
        </p>
      </div>

      {initialProducts.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <p className="text-lg font-medium mb-2">Products coming soon</p>
          <p className="text-sm mb-6">
            We are stocking up on this category. Check back soon or browse our full marketplace.
          </p>
          <Link
            href="/marketplace"
            className="inline-flex items-center gap-2 bg-primary text-white font-semibold px-6 py-3 rounded-full hover:bg-primary/90 transition-colors"
          >
            Browse All Products
          </Link>
        </div>
      ) : (
        <>
          <ProductGrid products={initialProducts} />
          <div className="text-center mt-10">
            <Link
              href={`/marketplace?category=${category}`}
              className="inline-flex items-center gap-2 border-2 border-primary text-primary font-semibold px-8 py-3 rounded-full hover:bg-primary hover:text-white transition-colors"
            >
              View All Products →
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
