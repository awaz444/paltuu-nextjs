"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchProducts, clearProducts } from "@/app/store/slices/marketplaceSlice";
import ProductGrid from "@/components/ProductGrid";

export default function ProchoicePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error } = useSelector((state: RootState) => state.marketplace);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    // Clear previous products and fetch Prochoice products
    dispatch(clearProducts());
    dispatch(fetchProducts({
      page: 1,
      limit: 24,
      filters: { keyword: "Prochoice" }
    }));
    setHasSearched(true);
  }, [dispatch]);

  if (loading && !hasSearched) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Prochoice products...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Prochoice Products in Pakistan</h1>
          <p className="text-gray-600">Discover premium Prochoice pet products for your beloved companions</p>
        </div>
        
        {products.length === 0 && hasSearched && !loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No Prochoice products found at the moment.</p>
            <p className="text-gray-500 mt-2">Please check back later for new arrivals.</p>
          </div>
        ) : (
          <ProductGrid products={products} />
        )}
      </div>
    </div>
  );
}