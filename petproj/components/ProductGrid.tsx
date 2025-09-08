import React from "react";
import Link from "next/link";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import "./productGrid.css";

interface Product {
  product_id: number;
  name: string;
  description: string;
  price: string;
  original_price?: string;
  category: string;
  collection: string;
  image_url: string;
  inStock?: boolean;
  rating?: number; // ⭐ average rating (0–5)
  ratingCount?: number; // number of reviews
}

interface ProductGridProps {
  products: Product[];
}

const ProductGrid: React.FC<ProductGridProps> = ({ products }) => {
  useSetPrimaryColor();

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const guestToken = getOrCreateGuestSessionId();

      const res = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-guest-token": guestToken || "",
        },
        body: JSON.stringify({
          product_id: product.product_id,
          quantity: 1,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to add to cart");
        return;
      }

      const data = await res.json();
      console.log("Cart updated:", data);
    } catch (err) {
      console.error("Error adding to cart:", err);
    }
  };

  // Helper to render stars
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

  return (
    <div className="product-grid-container">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4 gap-4">
        {products.map((product) => (
          <Link
            key={product.product_id}
            href={`/marketplace/${product.product_id}`}
            passHref
          >
            <div className="bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 product-card">
              <div className="relative">
                <img
                  src={product.image_url || "/product-placeholder.png"}
                  alt={product.name}
                  className="w-full aspect-square object-cover rounded-2xl"
                />
                {product.inStock === false && (
                  <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
                    <span className="text-white font-bold">Out of Stock</span>
                  </div>
                )}
              </div>
              <div className="py-4">
                <h3 className="font-bold text-lg mb-1 truncate max-w-[90%]">
                  {product.name}
                </h3>

                {/* ⭐ Rating */}
                {product.rating !== undefined && (
                  <div className="flex items-center gap-1 mb-2">
                    <div className="flex">{renderStars(product.rating)}</div>
                    {product.ratingCount !== undefined && (
                      <span className="text-sm text-gray-500">
                        ({product.ratingCount})
                      </span>
                    )}
                  </div>
                )}

                {product.original_price ? (
                  <div className="space-y-1">
                    <p className="text-gray-500 line-through text-sm">
                      PKR {parseInt(product.original_price).toLocaleString()}
                    </p>
                    <p className="text-primary font-semibold text-xl">
                      PKR {parseInt(product.price).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-primary font-semibold text-xl mb-3">
                    PKR {parseInt(product.price).toLocaleString()}
                  </p>
                )}

                <button
                  className={`w-full py-2 rounded-xl flex items-center justify-center gap-2 ${
                    product.inStock !== false
                      ? "bg-primary text-white hover:bg-primary-dark"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } transition-colors`}
                  onClick={(e) =>
                    product.inStock !== false && handleAddToCart(e, product)
                  }
                  disabled={product.inStock === false}
                >
                  <ShoppingCartOutlined />
                  {product.inStock !== false ? "Add to Cart" : "Out of Stock"}
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx>{`
        .product-grid-container {
          width: 100%;
        }
        @media (min-width: 1024px) {
          .product-grid-container {
            padding: 1rem 2rem;
          }
        }
        @media (min-width: 1280px) {
          .product-grid-container {
            padding: 1rem 2rem;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductGrid;
