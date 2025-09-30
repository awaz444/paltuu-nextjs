"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import MarketplaceFilterSection from "@/components/MarketplaceFilterSection";
import ProductGrid from "@/components/ProductGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";

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


  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Array<{ collection_id: number; name: string }>>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const [filters, setFilters] = useState({
    category: "",
    collection: "",
    keyword: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch both products and collections
        // Fetch products (paginated) and collections
        const [productsResponse, collectionsResponse] = await Promise.all([
          fetch(`/api/bazaar/products?page=${page}&limit=24`),
          fetch('/api/bazaar/collections')
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch products: ${productsResponse.status}`);
        }

  const apiProductsRaw = await productsResponse.json();
  const apiProducts = Array.isArray(apiProductsRaw.rows) ? apiProductsRaw.rows : apiProductsRaw;
  const total = apiProductsRaw.meta?.total ?? null;
        let collectionsData = [];

        if (collectionsResponse.ok) {
          collectionsData = await collectionsResponse.json();
          setCollections(collectionsData);
        }

        // Transform API data to match UI expectations
        const transformedProducts: Product[] = apiProducts
          .filter((product: any) => product.status === 'published' || product.status === null) // Only show published products
          .map((product: any) => {
            // Get the first variant for pricing
            const firstVariant = product.variants?.[0];
            const displayPrice = firstVariant?.price_override || product.price || 0;

            // Map collection IDs to names
            const getCollectionName = (product: any) => {
              if (product.collection_ids && product.collection_ids.length > 0) {
                const collection = collectionsData.find((c: any) =>
                  product.collection_ids.includes(c.collection_id)
                );
                return collection?.name || 'General';
              }
              return 'General';
            };

            return {
              ...product,
              name: product.title, // Map title to name for UI compatibility
              category: product.categories?.[0]?.name || 'Uncategorized',
              collection: getCollectionName(product),
              image_url: product.images?.[0] || '/placeholder-product.jpg',
              price: displayPrice.toString(),
              original_price: firstVariant?.compare_at_price ? String(firstVariant.compare_at_price) : undefined,
              inStock: product.variants?.some((v: any) => v.stock > 0) || false,
              // rating & ratingCount will be populated from the reviews API below
              rating: 0,
              ratingCount: 0,
            };
          });
          // Fetch review summaries for each product in parallel and attach avg rating + count
        try {
          const productsWithReviews = await Promise.all(
            transformedProducts.map(async (p: any) => {
              try {
                const resp = await fetch(`/api/bazaar/reviews?product_id=${encodeURIComponent(p.product_id)}`);
                if (!resp.ok) return { ...p, rating: 0, ratingCount: 0 };
                const reviews = await resp.json();
                const list = Array.isArray(reviews) ? reviews : [];
                const ratingCount = list.length;
                const avg = ratingCount > 0 ? list.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratingCount : 0;
                return { ...p, rating: Math.round(avg * 10) / 10, ratingCount };
              } catch (e) {
                return { ...p, rating: 0, ratingCount: 0 };
              }
            })
          );

          // Append new page results
          setProducts((prev) => [...prev, ...productsWithReviews]);
          if (total !== null) {
            const loaded = (page - 1) * 24 + productsWithReviews.length;
            setHasMore(loaded < total);
          } else {
            setHasMore(productsWithReviews.length >= 24);
          }
        } catch (err) {
          // If reviews fetch fails, fall back to the transformed list without ratings
          console.warn('Failed to fetch review summaries:', err);
          setProducts((prev) => [...prev, ...transformedProducts]);
          setHasMore(transformedProducts.length >= 24);
        }
      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    const fetchNext = async () => {
      setLoading(true);
      try {
        const productsResponse = await fetch(`/api/bazaar/products?page=${page}&limit=24`);
        const apiProductsRaw = await productsResponse.json();
        const apiProducts = Array.isArray(apiProductsRaw.rows) ? apiProductsRaw.rows : apiProductsRaw;
        const transformedProducts: Product[] = apiProducts
          .filter((product: any) => product.status === 'published' || product.status === null)
          .map((product: any) => {
            const firstVariant = product.variants?.[0];
            const displayPrice = firstVariant?.price_override || product.price || 0;
            const getCollectionName = (product: any) => {
              if (product.collection_ids && product.collection_ids.length > 0) {
                const collection = collections.find((c: any) => product.collection_ids.includes(c.collection_id));
                return collection?.name || 'General';
              }
              return 'General';
            };
            return {
              ...product,
              name: product.title,
              category: product.categories?.[0]?.name || 'Uncategorized',
              collection: getCollectionName(product),
              image_url: product.images?.[0] || '/placeholder-product.jpg',
              price: displayPrice.toString(),
              original_price: firstVariant?.compare_at_price ? String(firstVariant.compare_at_price) : undefined,
              inStock: product.variants?.some((v: any) => v.stock > 0) || false,
              rating: 0,
              ratingCount: 0,
            };
          });

        // attach reviews (best-effort, but don't block)
        const productsWithReviews = await Promise.all(
          transformedProducts.map(async (p: any) => {
            try {
              const resp = await fetch(`/api/bazaar/reviews?product_id=${encodeURIComponent(p.product_id)}`);
              if (!resp.ok) return { ...p, rating: 0, ratingCount: 0 };
              const reviews = await resp.json();
              const list = Array.isArray(reviews) ? reviews : [];
              const ratingCount = list.length;
              const avg = ratingCount > 0 ? list.reduce((s: number, r: any) => s + (r.rating || 0), 0) / ratingCount : 0;
              return { ...p, rating: Math.round(avg * 10) / 10, ratingCount };
            } catch (e) {
              return { ...p, rating: 0, ratingCount: 0 };
            }
          })
        );

        setProducts((prev) => [...prev, ...productsWithReviews]);
        const total = apiProductsRaw.meta?.total ?? null;
        if (total !== null) {
          const loaded = (page - 1) * 24 + productsWithReviews.length;
          setHasMore(loaded < total);
        } else {
          setHasMore(productsWithReviews.length >= 24);
        }
      } catch (err) {
        console.error('Error fetching page:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchNext();
  }, [page]);

  const handleReset = () => {
    setFilters({
      category: "",
      collection: "",
      keyword: "",
    });
  };

  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
  };

  const filteredProducts = products.filter((product) => {
    const matchesCategory = filters.category
      ? product.category === filters.category
      : true;
    const matchesCollection = filters.collection
      ? product.collection === filters.collection
      : true;
    const matchesKeyword = filters.keyword
      ? product.name.toLowerCase().includes(filters.keyword.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.keyword.toLowerCase())
      : true;

    return matchesCategory && matchesCollection && matchesKeyword;
  });

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
        <div ref={loaderRef} />
      </div>
    </>
  );
}
