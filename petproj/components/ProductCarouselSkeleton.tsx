"use client";

import React from "react";

interface ProductCarouselSkeletonProps {
  className?: string;
}

const ProductCarouselSkeleton: React.FC<ProductCarouselSkeletonProps> = ({ 
  className = "" 
}) => {
  // Responsive skeleton count
  const getSkeletonCount = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width >= 1280) return 5; // xl
      if (width >= 1024) return 4; // lg
      if (width >= 768) return 3;  // md
      if (width >= 640) return 2;  // sm
      return 1; // mobile
    }
    return 3; // Default for SSR
  };

  const skeletonCount = getSkeletonCount();

  return (
    <div className={`w-full ${className}`}>
      {/* Carousel Container */}
      <div className="relative">
        {/* Products Container */}
        <div className="overflow-hidden px-2">
          <div className="flex justify-center gap-4">
            {Array.from({ length: skeletonCount }, (_, index) => (
              <div
                key={index}
                className="relative bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-gray-100 flex-shrink-0 animate-pulse"
                style={{ 
                  width: `calc(${100 / skeletonCount}% - ${(skeletonCount - 1) * 16 / skeletonCount}px)`,
                  maxWidth: '280px',
                  minWidth: '200px'
                }}
              >
                {/* Product Image Skeleton */}
                <div className="relative bg-white rounded-2xl p-2">
                  <div className="w-full aspect-square bg-gray-200 rounded-xl"></div>
                </div>

                {/* Content Skeleton */}
                <div className="py-4">
                  {/* Title Skeleton */}
                  <div className="mb-2">
                    <div className="h-4 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>

                  {/* Rating Skeleton */}
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }, (_, i) => (
                        <div key={i} className="w-3 h-3 bg-gray-200 rounded-full"></div>
                      ))}
                    </div>
                    <div className="h-3 w-8 bg-gray-200 rounded ml-1"></div>
                  </div>

                  {/* Price Skeleton */}
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-20 bg-gray-200 rounded"></div>
                    <div className="h-3 w-16 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dots skeleton */}
        <div className="flex justify-center mt-6 gap-2">
          {Array.from({ length: Math.min(skeletonCount, 5) }, (_, i) => (
            <div key={i} className="w-2 h-2 bg-gray-200 rounded-full animate-pulse"></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProductCarouselSkeleton;