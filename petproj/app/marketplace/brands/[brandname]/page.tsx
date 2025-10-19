"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchProducts, clearProducts } from "@/app/store/slices/marketplaceSlice";
import ProductGrid from "@/components/ProductGrid";

// Define Product interface locally since it's not exported from marketplaceSlice
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


export default function BrandPage() {
  const params = useParams();
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error } = useSelector((state: RootState) => state.marketplace);
  const [hasSearched, setHasSearched] = useState(false);

  // Brand display name mapping
  const brandDisplayNames: { [key: string]: string } = {
    felicia: "Felicia Products in Pakistan",
    prochoice: "Prochoice Products in Pakistan", 
    homie: "Homie Products in Pakistan",
    petline: "Petline Products in Pakistan"
  };

  const brandName = Array.isArray(params.brandname) ? params.brandname[0] : params.brandname;
  const displayName = brandDisplayNames[brandName?.toLowerCase() || ""] || `${brandName} Products in Pakistan`;

  useEffect(() => {
    if (brandName) {
      // Clear previous products and fetch brand products
      dispatch(clearProducts());
      dispatch(fetchProducts({
        page: 1,
        limit: 24,
        filters: { keyword: brandName }
      }));
      setHasSearched(true);
    }
  }, [dispatch, brandName]);

    if (loading && !hasSearched) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading {brandName} products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600 mb-4">Error loading products: {error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
                    <p className="text-gray-600">Discover premium {brandName} pet products for your beloved companions</p>
                </div>
                
                {products.length === 0 && hasSearched && !loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-lg">No {brandName} products found at the moment.</p>
                        <p className="text-gray-500 mt-2">Please check back later for new arrivals.</p>
                    </div>
                ) : (
                    <ProductGrid products={products} />
                )}
            </div>
        </div>
    );
}