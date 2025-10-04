"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchProducts } from "@/app/store/slices/marketplaceSlice";
import { ChevronRight } from "lucide-react";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

interface Product {
  product_id: number;
  name: string;
  price: string;
  original_price?: string;
  category: string;
  image_url: string;
}

const categories = [
  { title: "Cat Food" },
  { title: "Dog Food" },
  { title: "Accessories" },
];

export default function BazaarPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading } = useSelector((s: RootState) => s.marketplace);

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 12, filters: {} }));
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">

      {/* 🐾 Hero Section */}
      <section className="bg-gray-100 py-16 text-center">
        <h1 className="text-4xl font-bold text-gray-900">All Products</h1>
        <p className="mt-3 text-gray-600">
          Explore food, accessories, and more for your beloved pets.
        </p>
      </section>

      {/* 🛍️ Category Sections */}
      <main className="flex-grow pb-20">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          {categories.map((cat) => (
            <section key={cat.title}>
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  {cat.title}
                </h2>
                <Link
                  href="#"
                  className="text-primary text-sm font-medium hover:underline flex items-center gap-1"
                >
                  View All <ChevronRight size={16} />
                </Link>
              </div>

              {/* Product Slider */}
              <div className="relative">
                <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
                  {loading ? (
                    <div className="text-gray-400 text-sm italic py-6 px-2">
                      Loading products...
                    </div>
                  ) : (
                    products.map((prod: Product) => (
                      <div
                        key={`${cat.title}-${prod.product_id}`}
                        className="min-w-[220px] sm:min-w-[240px] bg-white rounded-2xl border border-gray-100 shadow hover:shadow-md transition-shadow duration-300 flex-shrink-0"
                      >
                        <div className="relative w-full aspect-square bg-gray-100 rounded-t-2xl overflow-hidden">
                          <Image
                            src={prod.image_url}
                            alt={prod.name}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4">
                          <h3 className="text-sm font-semibold text-gray-900 truncate">
                            {prod.name}
                          </h3>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-base font-bold text-gray-900">
                              ₨ {prod.price}
                            </span>
                            {prod.original_price && (
                              <span className="text-sm text-gray-400 line-through">
                                ₨ {prod.original_price}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* View All Button */}
              <div className="text-center mt-6">
                <Link
                  href="#"
                  className="inline-block px-6 py-2 rounded-full bg-primary text-white font-medium hover:bg-primary/90 transition"
                >
                  View All
                </Link>
              </div>
            </section>
          ))}
        </div>
      </main>

    </div>
  );
}
