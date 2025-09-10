"use client";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import MarketplaceFilterSection from "@/components/MarketplaceFilterSection";
import { setProducts } from "../store/slices/marketplaceSlice";
import ProductGrid from "@/components/ProductGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";
import { RootState } from "../store/store";

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
function useScrollRestoration(key: string) {
  useEffect(() => {
    const pos = sessionStorage.getItem(key);
    if (pos) window.scrollTo(0, parseInt(pos));
    return () => {
      sessionStorage.setItem(key, String(window.scrollY));
    };
  }, [key]);
}
export default function Marketplace() {
  useSetPrimaryColor();
  useScrollRestoration("marketplace-scroll");

  const dispatch = useDispatch();
  const products = useSelector((state: RootState) => state.marketplace.products);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<any[]>([]);
  const [filters, setFilters] = useState({ category: "", collection: "", keyword: "" });

  useEffect(() => {
    const fetchData = async () => {
      if (products.length > 0) {
        setLoading(false); // already cached
        return;
      }
      try {
        setLoading(true);

        const [productsRes, collectionsRes] = await Promise.all([
          fetch("/api/bazaar/products"),
          fetch("/api/bazaar/collections")
        ]);

        if (!productsRes.ok) throw new Error("Failed to fetch products");
        const apiProducts = await productsRes.json();

        let collectionsData: any[] = [];
        if (collectionsRes.ok) {
          collectionsData = await collectionsRes.json();
          setCollections(collectionsData);
        }

        // transform products
        const transformed = apiProducts.map((p: any) => ({
          product_id: p.product_id,
          name: p.title,
          description: p.description,
          category: p.categories?.[0]?.name || "Uncategorized",
          collection: collectionsData.find((c) => p.collection_ids?.includes(c.collection_id))?.name || "General",
          image_url: p.images?.[0] || "/placeholder-product.jpg",
          price: (p.variants?.[0]?.price_override || p.price || 0).toString(),
          original_price: p.compare_at_price?.toString(),
          inStock: p.variants?.some((v: any) => v.stock > 0) || false,
          rating: 0,
          ratingCount: 0,
        }));

        // fetch reviews
        const withReviews = await Promise.all(transformed.map(async (p: Product) => {
          try {
            const resp = await fetch(`/api/bazaar/reviews?product_id=${p.product_id}`);
            if (!resp.ok) return p;
            const reviews = await resp.json();
            const count = reviews.length;
            const avg = count > 0 ? reviews.reduce((s: number, r: any) => s + (r.rating || 0), 0) / count : 0;
            return { ...p, rating: Math.round(avg * 10) / 10, ratingCount: count };
          } catch {
            return p;
          }
        }));

        dispatch(setProducts(withReviews));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, products]);

  // filtering...
  const filteredProducts = products.filter((p) => {
    const matchesCategory = filters.category ? p.category === filters.category : true;
    const matchesCollection = filters.collection ? p.collection === filters.collection : true;
    const matchesKeyword = filters.keyword
      ? p.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        p.description.toLowerCase().includes(filters.keyword.toLowerCase())
      : true;
    return matchesCategory && matchesCollection && matchesKeyword;
  });

  return (
    <>
      <Navbar />
      <div className="fullBody">
        <MarketplaceFilterSection filters={filters} onSearch={setFilters} onReset={() => setFilters({category:"",collection:"",keyword:""})}/>
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <MoonLoader size={30} color="#a03048" />
          </div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </>
  );
}
