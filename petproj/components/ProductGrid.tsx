"use client";

import React from "react";
import Link from "next/link";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { MoonLoader } from "react-spinners";
import { getOrCreateGuestSessionId } from "@/utils/guest";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { fetchCart, addToCart } from "@/app/store/slices/cartSlice";
import type { AppDispatch } from "@/app/store/store";
import "./ProductGrid.css";

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
  rating?: number;
  ratingCount?: number;
}

interface ProductGridProps {
  products: Product[];
  onProductClick?: (id: number) => void;
}

const ProductGrid: React.FC<ProductGridProps> = ({ products, onProductClick }) => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  const handleAddToCart = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const hasVariants =
        (product as any).hasVariants ||
        (product as any).variants?.length > 0 ||
        false;

      if (hasVariants) {
        if (onProductClick) onProductClick(product.product_id);
        else router.push(`/marketplace/${product.product_id}`);
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

  const renderStars = (rating: number = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i + 1 <= rating ? "text-yellow-500" : "text-gray-300"}
      >
        ★
      </span>
    ));
  };
const [loadingProductId, setLoadingProductId] = React.useState<number | null>(null);

  const handleCardClick = (productId: number) => {
  sessionStorage.setItem("marketplace-scroll", window.scrollY.toString());
  sessionStorage.setItem("marketplace-from-product", "true");

  setLoadingProductId(productId); // Show loader for clicked product

  if (onProductClick) onProductClick(productId);
};



  
  return (
    <div className="product-grid-container mt-4 sm:mt-2 md:mt-0">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Link
  key={product.product_id}
  href={`/marketplace/${product.product_id}`}
  onClick={() => handleCardClick(product.product_id)}
  className="relative bg-white pt-4 px-4 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 cursor-pointer block"
>
  {/* Full card content */}
  <div className={`transition-all duration-300 ${loadingProductId === product.product_id ? "blur-sm" : ""}`}>
    <div className="relative bg-white rounded-2xl p-2">
      <img
        src={product.image_url || "/product-placeholder.png"}
        alt={product.name}
        className="w-full aspect-square object-contain rounded-xl"
      />
      {product.inStock === false && (
        <div className="absolute top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center rounded-2xl">
          <span className="text-white font-bold">Out of Stock</span>
        </div>
      )}
    </div>

    <div className="py-4">
      <h3 className="font-bold text-sm mb-2 line-clamp-2 min-h-[2.5rem] leading-snug">
        {product.name}
      </h3>

      {product.rating !== undefined && (
        <div className="flex items-center gap-1 mb-2">
          <div className="flex">{renderStars(product.rating)}</div>
          {product.ratingCount !== undefined && (
            <span className="text-sm text-gray-500">({product.ratingCount})</span>
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
  {loadingProductId === product.product_id && (
    <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center rounded-3xl">
      <MoonLoader size={30} color="#a03048" />
      <p className="mt-2 text-sm font-medium text-primary animate-pulse">
        Loading...
      </p>
    </div>
  )}
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
