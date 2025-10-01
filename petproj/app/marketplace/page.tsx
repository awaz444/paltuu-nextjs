"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import MarketplaceFilterSection from "@/components/MarketplaceFilterSection";
import ProductGrid from "@/components/ProductGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/app/store/store';
import { fetchProducts, clearProducts } from '@/app/store/slices/marketplaceSlice';

// Product interface - matching ProductGrid expectations
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

export default function Marketplace() {


  const dispatch = useDispatch<AppDispatch>();
  const productsState = useSelector((s: RootState) => s.marketplace);
  const { products, loading, error, meta, hasMore, currentPage } = productsState;
  const [collections, setCollections] = useState<Array<{ collection_id: number; name: string }>>([]);
  const [page, setPage] = useState(1);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState({
    category: "",
    collection: "",
    keyword: "",
  });

  // initial load: fetch products and collections
  useEffect(() => {
    // load first page with current filters
    dispatch(fetchProducts({ page: 1, limit: 24, filters }));

    // load collections (small dataset) - keep as before
    (async () => {
      try {
        const res = await fetch('/api/bazaar/collections');
        if (res.ok) {
          const collectionsData = await res.json();
          setCollections(collectionsData);
        }
      } catch (e) {
        console.warn('Failed to load collections', e);
      }
    })();
  }, [dispatch]); // Only depend on dispatch to avoid refetching on filter changes

  // intersection observer to load next page
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !loading) {
      setPage((p) => p + 1);
    }
  }, [hasMore, loading]);

  useEffect(() => {
    const option = { root: null, rootMargin: '200px', threshold: 0 };
    const observer = new IntersectionObserver(handleObserver, option);
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  // refetch when page changes
  useEffect(() => {
    if (page === 1) return; // initial load already handled
    if (page <= currentPage) return; // avoid duplicate requests
    if (!hasMore) return; // no more products to load
    // fetch next page and append
    dispatch(fetchProducts({ page, limit: 24, filters, append: true }));
  }, [page, currentPage, hasMore, filters, dispatch]);

  const handleReset = () => {
    const newFilters = {
      category: "",
      collection: "",
      keyword: "",
    };
    setFilters(newFilters);
    // clear store and reload
    dispatch(clearProducts());
    setPage(1);
    dispatch(fetchProducts({ page: 1, limit: 24, filters: newFilters }));
  };

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    // reload from server with new filters
    dispatch(clearProducts());
    setPage(1);
    dispatch(fetchProducts({ page: 1, limit: 24, filters: newFilters }));
  };

  // since filtering is done on the backend now, we just use products from store
  const filteredProducts = products;

  return (
    <>

      <div className="fullBody">
        <MarketplaceFilterSection
          filters={filters}
          onSearch={handleSearch}
          onReset={handleReset}
        />
        <ProductGrid products={filteredProducts} />
        {loading && (
          <div className="flex justify-center items-center py-6">
            <MoonLoader size={24} color="#a03048" />
          </div>
        )}
        {error && (
          <div className="flex justify-center items-center min-h-[200px] text-red-500">
            <p>Error loading products: {error}</p>
          </div>
        )}
        {/* sentinel for infinite scroll */}
        {hasMore && <div ref={loaderRef} />}
        {!hasMore && products.length > 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>You've reached the end of the products!</p>
          </div>
        )}
      </div>
    </>
  );
}
