"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/app/store/store";
import { ChevronRight, ShoppingCart, Zap, Clock, Tag, TrendingUp, Star } from "lucide-react";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { fetchCart, addToCart } from "@/app/store/slices/cartSlice";
import { useRouter } from "next/navigation";

// Category definitions matching database
const categories = [
  {
    title: "Trending",
    icon: TrendingUp,
    slug: null,
    sortBy: 'trending',
    type: 'special'
  },
  {
    title: "Most Discounted",
    icon: Tag,
    slug: null,
    sortBy: 'discount',
    type: 'special'
  },
  {
    title: "Cat Food",
    icon: null,
    slug: 'food',
    categoryId: 1,
    subFilter: 'cat'
  },
  {
    title: "Dog Food",
    icon: null,
    slug: 'food',
    categoryId: 1,
    subFilter: 'dog'
  },
  {
    title: "Accessories & Grooming",
    icon: null,
    slug: 'accessories',
    categoryId: 2,
    multiCategory: ['accessories', 'grooming']
  },
  {
    title: "Healthcare",
    icon: null,
    slug: 'healthcare',
    categoryId: 4
  },
];

interface Product {
  product_id: number;
  title: string;
  slug: string;
  price: string;
  original_price?: string;
  image: string;
  collection_name: string;
  featured?: boolean;
  variants?: any[];
}

export default function BazaarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [categoryProducts, setCategoryProducts] = useState<Record<string, Product[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch products for each category
    const fetchAllCategories = async () => {
      setLoading(true);
      const results: Record<string, Product[]> = {};

      for (const cat of categories) {
        try {
          const params = new URLSearchParams();
          params.set('page', '1');
          params.set('limit', '10'); // Only 10 products per category

          if (cat.slug) {
            params.set('categorySlug', cat.slug);
          }

          if (cat.sortBy) {
            params.set('sortBy', cat.sortBy);
          }

          // Add keyword filter for cat/dog food
          if (cat.subFilter) {
            params.set('keyword', cat.subFilter);
          }

          const res = await fetch(`/api/bazaar/products-optimized?${params.toString()}`);
          if (res.ok) {
            const data = await res.json();
            // Map compare_at_price to original_price for consistency
            const mappedProducts = (data.rows || []).map((p: any) => ({
              ...p,
              original_price: p.compare_at_price,
            }));
            results[cat.title] = mappedProducts;
          } else {
            results[cat.title] = [];
          }
        } catch (err) {
          console.error(`Error fetching ${cat.title}:`, err);
          results[cat.title] = [];
        }
      }

      setCategoryProducts(results);
      setLoading(false);
    };

    fetchAllCategories();
  }, []);

  // 🛒 Add to cart handler
  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const hasVariants = (product?.variants && product.variants.length > 0) || false;
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
  const handleViewAll = (cat: typeof categories[0]) => {
    const params = new URLSearchParams();

    if (cat.slug) {
      params.set('categorySlug', cat.slug);
    }

    if (cat.sortBy) {
      params.set('sortBy', cat.sortBy);
    }

    if (cat.subFilter) {
      params.set('keyword', cat.subFilter);
    }

    router.push(`/marketplace?${params.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
  {/* 🐾 Hero Section */}
  <section className="relative w-full h-[80vh] sm:h-[85vh] md:h-[90vh] lg:h-[95vh] overflow-hidden">
    {/* Desktop Banner */}
    <Image
      src="/banner_web.webp"
      alt="Bazaar Banner"
      fill
      priority
      className="object-cover hidden md:block"
    />

    {/* Mobile Banner */}
    <Image
      src="/banner_phone.webp"
      alt="Bazaar Banner Mobile"
      fill
      priority
      className="object-cover block md:hidden"
    />
  </section>



     {/* 🛍️ Category Sections */}
      <main className="flex-grow mt-12 pb-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {categories.map((cat) => {
            const IconComponent = cat.icon;
            const filteredProducts = categoryProducts[cat.title] || [];

            return (
              <section key={cat.title}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {IconComponent && <IconComponent size={24} className="text-primary" />}
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
                    {loading ? (
                      <div className="text-gray-400 text-sm italic py-6 px-2">
                        Loading products...
                      </div>
                    ) : filteredProducts.length > 0 ? (
                      filteredProducts.map((prod) => (
                        <Link
                          href={`/marketplace/${prod.product_id}`}
                          key={`${cat.title}-${prod.product_id}`}
                          className="w-[280px] flex-shrink-0 bg-white rounded-2xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-lg transition-all duration-300 snap-start group flex flex-col h-[380px] overflow-hidden relative"
                        >
                          {/* Special Badges */}
                          {cat.sortBy === "discount" && prod.original_price && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                -{Math.round(((parseInt(prod.original_price) - parseInt(prod.price)) / parseInt(prod.original_price)) * 100)}%
                              </span>
                            </div>
                          )}
                          {cat.sortBy === "trending" && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                <TrendingUp size={12} /> TRENDING
                              </span>
                            </div>
                          )}

                          {/* Image Container */}
                          <div className="relative w-full h-[200px] bg-gray-100 overflow-hidden">
                            <Image
                              src={prod.image || "/product-placeholder.png"}
                              alt={prod.title}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>

                          {/* Content Container - Fixed Height */}
                          <div className="p-4 flex flex-col flex-grow">
                            {/* Product Name */}
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight text-sm min-h-[2.5rem]">
                              {prod.title}
                            </h3>

                            {/* Price Section */}
                            <div className="mt-auto">
                              {prod.original_price ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="text-primary font-bold text-base">
                                      ₨ {parseInt(prod.price).toLocaleString()}
                                    </p>
                                    <span className="text-green-600 text-xs font-medium bg-green-50 px-1.5 py-0.5 rounded">
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
                                  <p className="text-gray-400 line-through text-sm">
                                    ₨ {parseInt(prod.original_price).toLocaleString()}
                                  </p>
                                </div>
                              ) : (
                                <p className="text-primary font-bold text-base">
                                  ₨ {parseInt(prod.price).toLocaleString()}
                                </p>
                              )}

                              {/* Add to Cart Button */}
                              <button
                                className="w-full mt-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium bg-primary text-white hover:bg-primary/90 active:scale-95"
                                onClick={(e) => handleAddToCart(e, prod)}
                              >
                                <ShoppingCart size={16} />
                                Add to Cart
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="text-gray-400 text-sm italic py-6 px-2">
                        No products found in this category.
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}