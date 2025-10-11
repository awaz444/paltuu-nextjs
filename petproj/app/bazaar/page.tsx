"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import {
  ChevronRight,
  ShoppingCart,
  Zap,
  Clock,
  Tag,
  TrendingUp,
  Star,
  Flame
} from "lucide-react";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { fetchCart, addToCart } from "@/app/store/slices/cartSlice";
import { useRouter } from "next/navigation";
import {
  fetchAllBazaarCategories,
  fetchCategoryProducts,
  isCategoryFresh,
  type Product,
} from "@/app/store/slices/bazaarSlice";

// Category definitions matching database
const categories = [
  {
    title: "Trending",
    icon: TrendingUp,
    slug: null,
    sortBy: "trending",
    type: "special",
    featuredKey: "trending" as const,
  },
  {
    title: "Most Discounted",
    icon: Tag,
    slug: null,
    sortBy: "discount",
    type: "special",
    featuredKey: "discount" as const,
  },
  {
    title: "Cat Food",
    icon: null,
    slug: "food",
    categoryId: 1,
    subFilter: "cat",
    featuredKey: "catFood" as const,
  },
  {
    title: "Dog Food",
    icon: null,
    slug: "food",
    categoryId: 1,
    subFilter: "dog",
    featuredKey: "dogFood" as const,
  },
  {
    title: "Accessories & Grooming",
    icon: null,
    slug: "accessories",
    categoryId: 2,
    multiCategory: ["accessories", "grooming"],
    featuredKey: "accessoriesGrooming" as const,
  },
  {
    title: "Healthcare",
    icon: null,
    slug: "healthcare",
    categoryId: 4,
    featuredKey: "healthcare" as const,
  },
];

// Remove the Product interface since it's now imported from Redux slice

export default function BazaarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  // Get bazaar state from Redux
  const {
    categories: bazaarCategories,
    globalLoading,
    cacheExpiry,
  } = useSelector((state: RootState) => state.bazaar);

  // Track if initial load is complete
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Prefetch batch endpoint on mount for faster subsequent loads
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = '/api/bazaar/categories-batch';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  // Manual refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await dispatch(fetchAllBazaarCategories(true)); // true = force refresh
    } catch (error) {
      console.error("Error refreshing bazaar data:", error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    // Check if we already have products loaded in Redux
    const hasLoadedProducts = Object.values(bazaarCategories).some(
      (category) => category.products.length > 0
    );

    if (hasLoadedProducts) {
      // Products already loaded in Redux, no need to fetch
      setInitialLoadComplete(true);
      return;
    }

    // Fetch all categories with caching - using batch endpoint
    const loadBazaarData = async () => {
      try {
        setLoadError(null);
        await dispatch(fetchAllBazaarCategories(false)); // false = use cache if available
      } catch (error) {
        console.error("Error loading bazaar data:", error);
        setLoadError(error instanceof Error ? error.message : "Failed to load products");
      } finally {
        setInitialLoadComplete(true);
      }
    };

    loadBazaarData();
  }, [dispatch, bazaarCategories]);

  // 🛒 Add to cart handler
  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const hasVariants =
        (product?.variants && product.variants.length > 0) || false;
      if (hasVariants) {
        router.push(`/marketplace/${product.product_id}`);
        return;
      }

      await dispatch(
        addToCart({
          sessionId: getOrCreateGuestSessionId(),
          productId: product.product_id,
          variantId: null,
          quantity: 1,
        }) as any
      );
      dispatch(fetchCart());
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // Navigate to marketplace with category filter
  const handleViewAll = (cat: (typeof categories)[0]) => {
    const params = new URLSearchParams();

    if (cat.sortBy === "discount") {
      params.set("sortBy", "discount");
    } else if (cat.sortBy === "trending") {
      params.set("sortBy", "trending");
    } else {
      if (cat.slug) {
        params.set("categorySlug", cat.slug);
      }

      if (cat.subFilter) {
        params.set("keyword", cat.subFilter);
      }
    }

    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
  {/* 🐾 Hero Section */}
<section className="relative w-full overflow-hidden bazaar-banner">
  {/* Desktop & Tablet Banner */}
  <div className="hidden sm:block w-full">
    <Image
      src="/bazaarweb.png"
      alt="Bazaar Banner"
      width={1920}
      height={1080}
      priority
      className="w-full h-auto object-contain bg-[#A03048]"
    />
  </div>


        {/* Mobile Banner */}
        <div className="block sm:hidden w-full">
          <Image
            src="/bazaar-mobile.png"
            alt="Bazaar Banner Mobile"
            width={1080}
            height={1920}
            priority
            className="w-full h-auto object-contain bg-[#A03048]"
          />
        </div>

        <style jsx>{`
          .bazaar-banner {
            display: flex;
            justify-content: center;
            align-items: center;
            background-color: #a03048;
            width: 100vw;
            height: auto;
            margin: 0;
            padding: 0;
          }
          html,
          body {
            margin: 0;
            padding: 0;
            overflow-x: hidden;
          }
        `}</style>
      </section>

      {/* 🛍️ Category Sections */}
      <main className="flex-grow mt-12 pb-20">
        {/* Global Error State */}
        {loadError && !globalLoading && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-gray-800 font-semibold text-lg mb-2">Oops! Something went wrong</p>
              <p className="text-gray-600 mb-6">{loadError}</p>
              <button
                onClick={handleRefresh}
                className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Categories Grid - Always Show (with skeleton on first load) */}
        {!loadError && (
        <div className="max-w-7xl mx-auto px-6 space-y-16">{categories.map((cat) => {
            const IconComponent = cat.icon;
            const categorySection = bazaarCategories[cat.title];
            const filteredProducts = categorySection?.products || [];
            const isLoading = categorySection?.loading || globalLoading;

            return (
              <section key={cat.title}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {IconComponent && (
                      <IconComponent size={24} className="text-primary" />
                    )}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {cat.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => handleViewAll(cat)}
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All <ChevronRight size={16} />
                  </button>
                </div>

                {/* Product Slider */}
                <div className="relative">
                  <div className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
                    {isLoading ? (
                      [...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-[240px] flex-shrink-0 bg-white rounded-3xl shadow-sm border animate-pulse"
                        >
                          <div className="w-full h-[240px] bg-gray-200 rounded-t-2xl"></div>
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-6 bg-gray-200 rounded w-2/3 mt-2"></div>
                            <div className="h-10 bg-gray-200 rounded mt-3"></div>
                          </div>
                        </div>
                      ))
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((prod: Product) => {
                        const rating = prod.rating ?? 0;
                        const reviewCount = prod.reviewCount ?? 0;
                        return (
                          <Link
                            href={`/marketplace/${prod.product_id}`}
                            key={`${cat.title}-${prod.product_id}`}
                            onClick={() => {
                              sessionStorage.setItem(
                                "marketplace-scroll",
                                window.scrollY.toString()
                              );
                              sessionStorage.setItem(
                                "marketplace-from-product",
                                "true"
                              );
                            }}
                            className="w-[240px] flex-shrink-0 bg-white rounded-3xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-lg hover:scale-102 transition-all duration-300 snap-start flex flex-col overflow-hidden cursor-pointer group"
                          >
                            {/* Image */}
                            <div className="relative bg-white rounded-2xl p-2">
                              <img
                                src={prod.image || "/product-placeholder.png"}
                                alt={prod.title}
                                className="w-full aspect-square object-contain rounded-xl transition-transform duration-300"
                              />
                              {/* Badges */}
                              {cat.sortBy === "discount" &&
                                prod.original_price && (
                                  <div className="absolute top-3 left-3 z-10">
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                      -
                                      {Math.round(
                                        ((parseInt(prod.original_price) -
                                          parseInt(prod.price)) /
                                          parseInt(prod.original_price)) *
                                          100
                                      )}
                                      %
                                    </span>
                                  </div>
                                )}
                              {cat.sortBy === "trending" && (
                                <div className="absolute top-3 left-3 z-10">
                                  <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 py-2">
                                    <Flame size={12} />
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            <div className="p-3 flex flex-col flex-grow">
                              {/* Title */}
                              <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-snug text-sm min-h-[2.5rem]">
                                {prod.title}
                              </h3>

                              {/* Rating */}
                              {rating > 0 ? (
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className={
                                          i < Math.floor(rating)
                                            ? "fill-yellow-400"
                                            : "fill-gray-200"
                                        }
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs font-medium text-gray-700 ml-1">
                                    {rating.toFixed(1)}
                                  </span>
                                  {reviewCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                      ({reviewCount} review
                                      {reviewCount > 1 ? "s" : ""})
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 mb-2">
                                  <div className="flex text-gray-200">
                                    {[...Array(5)].map((_, i) => (
                                      <Star
                                        key={i}
                                        size={14}
                                        className="fill-gray-200"
                                      />
                                    ))}
                                  </div>
                                  <span className="text-xs text-gray-400 ml-1">
                                    No reviews yet
                                  </span>
                                </div>
                              )}

                              {/* Price */}
                              <div className="mt-auto flex items-center gap-2">
                                <p className="text-primary font-bold text-sm">
                                  ₨ {parseInt(prod.price).toLocaleString()}
                                </p>
                                {prod.original_price && (
                                  <p className="text-gray-400 line-through text-xs">
                                    ₨{" "}
                                    {parseInt(
                                      prod.original_price
                                    ).toLocaleString()}
                                  </p>
                                )}
                                {prod.original_price && (
                                  <span className="text-green-600 text-xs font-medium bg-green-50 px-1 py-0.5 rounded">
                                    -
                                    {Math.round(
                                      ((parseInt(prod.original_price) -
                                        parseInt(prod.price)) /
                                        parseInt(prod.original_price)) *
                                        100
                                    )}
                                    %
                                  </span>
                                )}
                              </div>

                              {/* Add to Cart */}
                              <button
                                onClick={(e) => handleAddToCart(e, prod)}
                                className="w-full mt-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium bg-primary text-white hover:bg-primary/90 active:scale-95"
                              >
                                <ShoppingCart size={16} /> Add to Cart
                              </button>
                            </div>
                          </Link>
                        );
                      })
                    ) : categorySection?.error ? (
                      <div className="text-gray-400 text-sm italic py-6 px-2 flex items-center gap-2">
                        <span className="text-red-500">⚠️</span>
                        Error loading products: {categorySection.error}
                      </div>
                    ) : (
                      // Show skeleton loading when no products yet
                      [...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="w-[240px] flex-shrink-0 bg-white rounded-3xl shadow-sm border animate-pulse"
                        >
                          <div className="w-full h-[240px] bg-gray-200 rounded-t-2xl"></div>
                          <div className="p-4 space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-6 bg-gray-200 rounded w-2/3 mt-2"></div>
                            <div className="h-10 bg-gray-200 rounded mt-3"></div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
        )}
      </main>
    </div>
  );
}
