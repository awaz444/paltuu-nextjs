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
  Flame,
  Heart,
  PawPrint,
  Bone,
  Scissors,
  Home,
  Search,
  Store,
} from "lucide-react";
import { MoonLoader } from "react-spinners";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { fetchCart, addToCart, resetCartState } from "@/app/store/slices/cartSlice";
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
    icon: PawPrint,
    slug: "food",
    categoryId: 1,
    subFilter: "cat",
    featuredKey: "catFood" as const,
  },
  {
    title: "Dog Food",
    icon: Bone,
    slug: "food",
    categoryId: 1,
    subFilter: "dog",
    featuredKey: "dogFood" as const,
  },
  {
    title: "Accessories & Grooming",
    icon: Scissors,
    slug: "accessories",
    categoryId: 2,
    multiCategory: ["accessories", "grooming"],
    featuredKey: "accessoriesGrooming" as const,
  },
  {
    title: "Housing",
    icon: Home,
    slug: "housing",
    categoryId: 4,
    featuredKey: "housing" as const,
  },
];

// Brand definitions for Shop by Brands section
const brands = [
  {
    name: "Felicia",
    slug: "felicia",
    image:
    "felicia gemini.png",
    description: "Premium pet nutrition",
    longDescription:
      "Felicia offers premium pet nutrition solutions crafted with the finest ingredients to ensure your pets receive optimal health and vitality. Our scientifically formulated products support healthy growth, strong immunity, and overall well-being for pets of all ages and breeds.",
  },
  {
    name: "Prochoice",
    slug: "prochoice",
    image:
      "prochoice gemini.png",
    description: "Natural pet food",
    longDescription:
      "Prochoice delivers high-quality pet food made from natural ingredients and balanced nutrition. Our range includes specialized formulas for different life stages, dietary needs, and health conditions, ensuring every pet gets the nutrition they deserve for a happy, healthy life.",
  },
  {
    name: "Homie",
    slug: "homie",
    image:
      "homie gemini.png",
    description: "Comfort-focused pet products",
    longDescription:
      "Homie specializes in creating comfortable and cozy products that make your pets feel at home. From plush beds and blankets to toys and accessories, our products are designed to provide maximum comfort and happiness for your beloved companions.",
  },
  {
    name: "Petline",
    slug: "petline",
    image:
      "petline gemini.png",
    description: "Comprehensive pet care",
    longDescription:
      "Petline provides comprehensive pet care solutions including grooming supplies, health supplements, training aids, and wellness products. Our complete range ensures that every aspect of your pet's care is covered with professional-grade quality and reliability.",
  },
  {
    name: "Pedigree",
    slug: "pedigree",
    image:
      "pedigree gemini.png",
    description: "Trusted dog nutrition",
    longDescription:
      "Pedigree has been a trusted name in dog nutrition for decades, providing complete and balanced meals for dogs of all sizes and life stages. Our scientifically developed recipes include essential nutrients, vitamins, and minerals to support healthy growth, strong bones, and vibrant coats.",
  },
  {
    name: "Gourmet",
    slug: "gourmet",
    image:
      "gourmet gemini.png",
    description: "Premium cat cuisine",
    longDescription:
      "Gourmet delivers exquisite culinary experiences for cats with premium ingredients and sophisticated flavors. Our range includes gourmet wet foods, treats, and specialized nutrition designed to satisfy even the most discerning feline palates.",
  },
  {
    name: "Brit Care",
    slug: "brit-care",
    image:
      "brit care gemini.png",
    description: "Premium pet nutrition",
    longDescription:
      "Brit Care provides premium nutrition solutions for dogs and cats with scientifically formulated recipes. Our comprehensive range includes specialized diets for different life stages, health conditions, and dietary preferences, ensuring optimal nutrition for every pet.",
  },
  {
    name: "Royal Canin",
    slug: "royal-canin",
    image:
      "royal canine gemini.png",
    description: "Veterinary nutrition leader",
    longDescription:
      "Royal Canin is the global leader in veterinary nutrition, offering scientifically formulated diets for dogs and cats. With over 50 years of expertise, we provide breed-specific, size-specific, and health-focused nutrition solutions backed by veterinary research and nutritional science.",
  },
  {
    name: "Whiskas",
    slug: "whiskas",
    image:
      "whiskas gemini.png",
    description: "Complete cat nutrition",
    longDescription:
      "Whiskas provides complete and balanced nutrition for cats at every life stage. From kitten to senior, our range includes wet and dry foods, treats, and specialized diets formulated with essential nutrients to keep cats healthy, happy, and thriving throughout their lives.",
  },
  {
    name: "Fluff'n Bluff",
    slug: "fluff-n-bluff",
    image:
      "fnb gemini.png",
    description: "Premium pet grooming",
    longDescription:
      "Fluff'n Bluff specializes in premium pet grooming products and accessories designed to keep your pets looking and feeling their best. Our comprehensive range includes shampoos, conditioners, brushes, nail care tools, and styling accessories for professional-quality grooming at home.",
  },
  {
    name: "Jungle",
    slug: "jungle",
    image:
      "jungle gemini.png",
    description: "Wild-inspired pet products",
    longDescription:
      "Jungle brings the wild into your pet's life with nature-inspired products and accessories. Our collection includes natural toys, organic treats, eco-friendly bedding, and adventure gear designed to satisfy your pet's natural instincts while promoting environmental sustainability.",
  },
];

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
  const [loadingProductId, setLoadingProductId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Prefetch batch endpoint on mount for faster subsequent loads
  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = "/api/bazaar/categories-batch";
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

  // Search function
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(
        `/marketplace?page=1&keyword=${encodeURIComponent(searchTerm.trim())}`
      );
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
        setLoadError(
          error instanceof Error ? error.message : "Failed to load products"
        );
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

      // Get session ID for guest users (will be ignored if user is logged in)
      const sessionId = getOrCreateGuestSessionId();
      console.log('🛒 Adding to cart - sessionId:', sessionId);

      await dispatch(
        addToCart({
          sessionId: sessionId,
          productId: product.product_id,
          variantId: null,
          quantity: 1,
        }) as any
      );

      // Refetch cart to get updated data
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
            className="w-full h-auto object-contain bg-gray-50"
          />
        </div>

        {/* Mobile Banner */}
        <div className="block sm:hidden w-full">
          <Image
            src="/ig-post.png"
            alt="Bazaar Banner Mobile"
            width={1080}
            height={1920}
            priority
            className="w-full h-auto"
          />
        </div>

        <style jsx>{`
          .bazaar-banner {
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
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

      {/* 🔍 Search Bar Section */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Look for your favorite products"
                className="w-full pl-10 sm:pl-12 pr-24 py-2.5 sm:py-4 rounded-2xl border-2 border-gray-200 focus:border-primary focus:outline-none focus:shadow-none transition-all duration-200 text-sm sm:text-lg bg-gray-50 hover:bg-white [outline:none!important] [box-shadow:none!important]"
              />

              <button
                type="submit"
                className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 bg-primary text-white px-3 sm:px-4 py-2 sm:py-2 rounded-lg sm:rounded-xl font-medium hover:bg-[color-mix(in srgb, var(--primary) 90%, black 10%)] transition-colors duration-200"
                aria-label="Search"
              >
                <Search size={16} className="sm:w-5 sm:h-5" />
              </button>
            </div>
            <p className="text-center text-gray-500 text-xs sm:text-sm mt-3">
              Discover amazing pet products for your furry friend
            </p>
          </form>
        </div>
      </section>

      {/* 🛍️ Category Sections */}
      <main className="flex-grow mt-4 pb-8">
        {/* Global Error State */}
        {loadError && !globalLoading && (
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-red-500 text-6xl mb-4">⚠️</div>
              <p className="text-gray-800 font-semibold text-lg mb-2">
                Oops! Something went wrong
              </p>
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
          <div className="max-w-7xl mx-auto px-6 space-y-10">
            {categories.map((cat, index) => {
              const IconComponent = cat.icon;
              const categorySection = bazaarCategories[cat.title];
              const filteredProducts = categorySection?.products || [];
              const isLoading = categorySection?.loading || globalLoading;

              return (
                <div key={cat.title}>
                  <section className="mb-2">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent size={24} className="text-primary" />
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
                      <div className="flex gap-5 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-100 pb-3 snap-x snap-mandatory">
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
                                  setLoadingProductId(prod.product_id);
                                  sessionStorage.setItem(
                                    "marketplace-scroll",
                                    window.scrollY.toString()
                                  );
                                  sessionStorage.setItem(
                                    "marketplace-from-product",
                                    "true"
                                  );
                                }}
                                className="w-[240px] flex-shrink-0 bg-white rounded-3xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md hover:scale-102 transition-all duration-300 snap-start flex flex-col overflow-hidden cursor-pointer group relative"
                              >
                                {/* Modern Loader Overlay with MoonLoader */}
                                {loadingProductId === prod.product_id && (
                                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
                                    <MoonLoader
                                      color="#A03048" // primary color
                                      size={40} // size of the loader
                                      speedMultiplier={1.2}
                                    />
                                  </div>
                                )}

                                {/* Image */}
                                <div className="relative bg-white rounded-2xl p-2">
                                  <img
                                    src={
                                      prod.image || "/product-placeholder.png"
                                    }
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

                  {/* Shop by Brands section - Insert after "Most Discounted" */}
                  {cat.title === "Most Discounted" && (
                    <section className="mb-2 mt-10">
                      {/* Header */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-3">
                          <Store size={24} className="text-primary" />
                          <h2 className="text-2xl font-bold text-gray-900">
                            Shop by Brands
                          </h2>
                        </div>
                        <Link
                          href="/marketplace/brands"
                          className="text-primary text-sm font-medium hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          View All <ChevronRight size={16} />
                        </Link>
                      </div>

                      {/* Brand Cards */}
                      <div className="relative">
                        <div className="flex gap-5 overflow-x-auto overflow-y-hidden scrollbar-thin scrollbar-thumb-primary scrollbar-track-gray-100 pb-3 snap-x snap-mandatory">
                          {brands.map((brand) => (
                            <Link
                              href={`/marketplace/brands/${brand.slug}`}
                              key={brand.slug}
                              className="w-[240px] flex-shrink-0 bg-white rounded-3xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-md hover:scale-102 transition-all duration-300 snap-start flex flex-col overflow-hidden cursor-pointer group"
                            >
                              {/* Brand Image */}
                              <div className="relative bg-white rounded-2xl p-4">
                                <img
                                  src={brand.image}
                                  alt={brand.name}
                                  className="w-full aspect-square object-contain rounded-xl transition-transform duration-300"
                                />
                              </div>

                              {/* Brand Info */}
                              <div className="p-4 flex flex-col items-center text-center">
                                <h3 className="font-bold text-gray-900 text-lg mb-1">
                                  {brand.name}
                                </h3>
                                <p className="text-gray-600 text-sm">
                                  {brand.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </section>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
