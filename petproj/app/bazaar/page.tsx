"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchProducts } from "@/app/store/slices/marketplaceSlice";
import { ChevronRight, ShoppingCart, Star, Zap, Clock, Tag, Crown } from "lucide-react";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { fetchCart, addToCart } from "@/app/store/slices/cartSlice";
import { useRouter } from "next/navigation";

const categories = [
  { title: "Cat Food" },
  { title: "Dog Food" },
  { 
    title: "Accessories",
    subcategories: ["Collars", "Leashes", "Bowls", "Tags", "Carriers"]
  },
  { 
    title: "Toys",
    subcategories: ["Chew Toys", "Interactive Toys", "Plush Toys", "Scratchers"]
  },
  { 
    title: "Grooming",
    subcategories: ["Shampoos", "Brushes", "Clippers", "Towels"]
  },
  { 
    title: "Health",
    subcategories: ["Supplements", "Vitamins", "Flea/Tick Control"]
  },
  { title: "Trending Now", icon: Zap, type: "trending" },
  { title: "New Arrivals", icon: Clock, type: "new" },
  { title: "Deals & Discounts", icon: Tag, type: "deals" },
  { title: "Featured Brands", icon: Crown, type: "brands" }
];

export default function BazaarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { products, loading } = useSelector((s: RootState) => s.marketplace);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 50, filters: {} }));
  }, [dispatch]);

  // ⭐ Render stars helper
  const renderStars = (rating: number = 0) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= rating ? "text-yellow-500" : "text-gray-300"}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  // 🛒 Add to cart handler
  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const hasVariants =
        product?.hasVariants || product?.variants?.length > 0 || false;
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

  // Filter products for special sections (you can replace with actual filtering logic)
  const getFilteredProducts = (category: any) => {
    switch (category.type) {
      case "trending":
        return products.filter((_, index) => index % 3 === 0); // Mock trending filter
      case "new":
        return products.filter((_, index) => index % 4 === 0); // Mock new arrivals
      case "deals":
        return products.filter(p => p.original_price && parseInt(p.original_price) > parseInt(p.price)); // Actual discount filter
      case "brands":
        return products.filter((_, index) => index % 5 === 0); // Mock brands filter
      default:
        return products;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 🐾 Hero Section */}
      {/* 🐾 Hero Section */}
{/* 🐾 Hero Section */}
<section className="relative w-full h-[700px] sm:h-[650px] md:h-[450px] overflow-hidden">
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
            const filteredProducts = getFilteredProducts(cat);
            
            return (
              <section key={cat.title}>
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    {IconComponent && <IconComponent size={24} className="text-primary" />}
                    <h2 className="text-2xl font-bold text-gray-900">
                      {cat.title}
                    </h2>
                    {cat.subcategories && (
                      <div className="hidden md:flex items-center gap-2 ml-4">
                        {cat.subcategories.map((sub, index) => (
                          <span
                            key={sub}
                            className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <Link
                    href="#"
                    className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                  >
                    View All <ChevronRight size={16} />
                  </Link>
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
                          className="w-[280px] flex-shrink-0 bg-white rounded-2xl border-2 border-transparent hover:border-primary shadow-sm hover:shadow-lg transition-all duration-300 snap-start group flex flex-col h-[420px] overflow-hidden relative"
                        >
                          {/* Special Badges */}
                          {cat.type === "deals" && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                HOT DEAL
                              </span>
                            </div>
                          )}
                          {cat.type === "new" && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                NEW
                              </span>
                            </div>
                          )}
                          {cat.type === "trending" && (
                            <div className="absolute top-3 left-3 z-10">
                              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                TRENDING
                              </span>
                            </div>
                          )}

                          {/* Image Container */}
                          <div className="relative w-full h-[200px] bg-gray-100 overflow-hidden">
                            <Image
                              src={prod.image_url || "/product-placeholder.png"}
                              alt={prod.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            {prod.inStock === false && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">
                                  Out of Stock
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Content Container - Fixed Height */}
                          <div className="p-4 flex flex-col flex-grow">
                            {/* Product Name */}
                            <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight text-sm min-h-[2.5rem]">
                              {prod.name}
                            </h3>

                            {/* Rating */}
                            {prod.rating !== undefined && (
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex text-sm">
                                  {renderStars(prod.rating)}
                                </div>
                                {prod.ratingCount !== undefined && (
                                  <span className="text-xs text-gray-500 ml-1">
                                    ({prod.ratingCount})
                                  </span>
                                )}
                              </div>
                            )}

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
                                className={`w-full mt-3 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm font-medium ${
                                  prod.inStock !== false
                                    ? "bg-primary text-white hover:bg-primary/90 active:scale-95"
                                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                                }`}
                                onClick={(e) =>
                                  prod.inStock !== false && handleAddToCart(e, prod)
                                }
                                disabled={prod.inStock === false}
                              >
                                <ShoppingCart size={16} />
                                {prod.inStock !== false
                                  ? "Add to Cart"
                                  : "Out of Stock"}
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

                {/* View All Button */}
                {/* <div className="text-center mt-8">
                  <Link
                    href="#"
                    className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition-colors shadow-sm"
                  >
                    View All {cat.title}
                    <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div> */}
              </section>
            );
          })}
        </div>
      </main>
    </div>
  );
}