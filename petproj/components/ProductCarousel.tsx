"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MoonLoader } from "react-spinners";

interface Product {
    product_id: number;
    title: string;
    name?: string;
    description?: string;
    price: string;
    original_price?: string;
    category?: string;
    collection?: string;
    image_url: string;
    inStock?: boolean;
    rating?: number;
    ratingCount?: number;
    trending?: boolean;
    discount?: number;
}

interface ProductCarouselProps {
    products: Product[];
    title?: string;
    className?: string;
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({
    products,
    title = "Featured Products",
    className = "",
}) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loadingProductId, setLoadingProductId] = useState<number | null>(
        null
    );
    const [isHovered, setIsHovered] = useState(false);
    const autoScrollRef = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Responsive items per view
    const getItemsPerView = () => {
        if (typeof window !== "undefined") {
            const width = window.innerWidth;
            if (width >= 1280) return 5; // xl
            if (width >= 1024) return 4; // lg
            if (width >= 768) return 3; // md
            if (width >= 640) return 2; // sm
            return 1; // mobile
        }
        return 3; // Default for SSR
    };

    const [itemsPerView, setItemsPerView] = useState(getItemsPerView);

    // Create extended products array for infinite scroll
    const extendedProducts =
        products.length > 0 ? [...products, ...products, ...products] : [];
    const originalLength = products.length;

    React.useEffect(() => {
        const handleResize = () => {
            setItemsPerView(getItemsPerView());
        };

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Auto-scroll functionality
    useEffect(() => {
        if (products.length <= itemsPerView || isHovered) return;

        const startAutoScroll = () => {
            autoScrollRef.current = setInterval(() => {
                nextSlide();
            }, 4000); // Auto-scroll every 4 seconds
        };

        startAutoScroll();

        return () => {
            if (autoScrollRef.current) {
                clearInterval(autoScrollRef.current);
            }
        };
    }, [products.length, itemsPerView, isHovered, currentIndex]);

    const nextSlide = () => {
        setCurrentIndex((prev) => {
            const nextIndex = prev + 1;
            // When we reach near the end of extended array, reset to beginning seamlessly
            if (nextIndex >= originalLength * 2) {
                return 0; // Jump back to start of first duplicate set
            }
            return nextIndex;
        });
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => {
            const prevIndex = prev - 1;
            if (prevIndex < 0) {
                return originalLength * 2 - 1; // Jump to end of second duplicate set
            }
            return prevIndex;
        });
    };

    const goToSlide = (index: number) => {
        setCurrentIndex(index);
    };

    const handleCardClick = (productId: number) => {
        sessionStorage.setItem("marketplace-scroll", window.scrollY.toString());
        sessionStorage.setItem("marketplace-from-product", "true");
        setLoadingProductId(productId);
    };

    const renderStars = (rating: number = 0) => {
        return Array.from({ length: 5 }, (_, i) => (
            <span
                key={i}
                className={
                    i + 1 <= rating ? "text-yellow-500" : "text-gray-300"
                }>
                ★
            </span>
        ));
    };

    if (!products || products.length === 0) {
        return (
            <div className={`w-full ${className}`}>
                <div className="text-center py-8">
                    <p className="text-gray-500">No products available</p>
                </div>
            </div>
        );
    }

    // Calculate visible products based on current index
    const getVisibleProducts = () => {
        const visible = [];
        for (let i = 0; i < itemsPerView; i++) {
            const index = (currentIndex + i) % extendedProducts.length;
            visible.push(extendedProducts[index]);
        }
        return visible;
    };

    const visibleProducts = getVisibleProducts();

    return (
        <div className={`w-full ${className}`}>
            {/* Carousel Container */}
            <div
                className="relative"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}>
                {/* Products Container */}
                <div className="overflow-hidden px-2 relative" ref={containerRef}>
                    {/* Navigation Arrows - Sticky to container edges */}
                    {products.length > itemsPerView && (
                        <>
                            <button
                                onClick={prevSlide}
                                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200 border border-gray-200">
                                <ChevronLeft size={16} className="text-gray-700" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-all duration-200 border border-gray-200">
                                <ChevronRight size={16} className="text-gray-700" />
                            </button>
                        </>
                    )}
                    <div className="flex justify-center gap-4 transition-all duration-500 ease-in-out">
                        {visibleProducts.map((product, index) => {
                            const rating = product.rating || 0;
                            const productTitle =
                                product.title || product.name || "";
                            const displayRating = product.rating !== undefined;

                            return (
                                <Link
                                    key={`${product.product_id}-${currentIndex}-${index}`}
                                    href={`/marketplace/${product.product_id}`}
                                    onClick={() =>
                                        handleCardClick(product.product_id)
                                    }
                                    className="relative bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 cursor-pointer block flex-shrink-0"
                                    style={{
                                        width: `calc(${100 / itemsPerView}% - ${
                                            ((itemsPerView - 1) * 16) /
                                            itemsPerView
                                        }px)`,
                                        maxWidth: "280px",
                                        minWidth: "200px",
                                    }}>
                                    {/* Full card content */}
                                    <div
                                        className={`transition-all duration-300 ${
                                            loadingProductId ===
                                            product.product_id
                                                ? "blur-sm"
                                                : ""
                                        }`}>
                                        {/* Product Image */}
                                        <div className="relative bg-white rounded-2xl p-2">
                                            <div className="w-full aspect-square flex items-center justify-center">
                                                <img
                                                    src={
                                                        product.image_url ||
                                                        "/product-placeholder.png"
                                                    }
                                                    alt={productTitle}
                                                    className="max-w-full max-h-full object-contain rounded-xl"
                                                    onError={(e) => {
                                                        const target =
                                                            e.target as HTMLImageElement;
                                                        target.src =
                                                            "/product-placeholder.png";
                                                    }}
                                                />
                                            </div>
                                            {product.inStock === false && (
                                                <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
                                                    <span className="text-white font-bold">
                                                        Out of Stock
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="py-4 text-left">
                                            <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem] leading-snug text-left">
                                                {productTitle}
                                            </h3>

                                            {displayRating && (
                                                <div className="flex items-center gap-1 mb-2 justify-start">
                                                    <div className="flex">
                                                        {renderStars(rating)}
                                                    </div>
                                                    {product.ratingCount !==
                                                        undefined && (
                                                        <span className="text-sm text-gray-500">
                                                            (
                                                            {
                                                                product.ratingCount
                                                            }
                                                            )
                                                        </span>
                                                    )}
                                                </div>
                                            )}

                                            {product.original_price ? (
                                                <div className="flex items-center gap-2">
                                                    <p className="text-primary font-semibold text-sm">
                                                        PKR {parseInt(product.price).toLocaleString()}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-gray-400 line-through text-sm">
                                                            {parseInt(product.original_price).toLocaleString()}
                                                        </p>
                                                        <span className="text-green-600 text-sm font-medium">
                                                            -{Math.round(((parseInt(product.original_price) - parseInt(product.price)) / parseInt(product.original_price)) * 100)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            ) : (
                                                <p className="text-primary font-semibold text-sm mb-0">
                                                    PKR {parseInt(product.price).toLocaleString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Loader overlay */}
                                    {loadingProductId ===
                                        product.product_id && (
                                        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                                            <MoonLoader
                                                size={30}
                                                color="#a03048"
                                            />
                                            <p className="mt-2 text-sm font-medium text-primary animate-pulse">
                                                Loading...
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Dots Indicator */}
                {products.length > itemsPerView && (
                    <div className="flex justify-center mt-6 gap-2">
                        {Array.from(
                            { length: Math.min(products.length, 8) },
                            (_, i) => (
                                <button
                                    key={i}
                                    onClick={() => goToSlide(i)}
                                    className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                        i === currentIndex % products.length
                                            ? "bg-gray-100 w-4"
                                            : "bg-gray-300"
                                    }`}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductCarousel;
