"use client";
import { useEffect, useState } from "react";
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
  useSetPrimaryColor();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Array<{ collection_id: number; name: string }>>([]);

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
        const [productsResponse, collectionsResponse] = await Promise.all([
          fetch('/api/bazaar/products'),
          fetch('/api/bazaar/collections')
        ]);

        if (!productsResponse.ok) {
          throw new Error(`Failed to fetch products: ${productsResponse.status}`);
        }

        const apiProducts = await productsResponse.json();
        let collectionsData = [];

        if (collectionsResponse.ok) {
          collectionsData = await collectionsResponse.json();
          setCollections(collectionsData);
        }

        // Transform API data to match UI expectations
        const transformedProducts: Product[] = apiProducts
          .filter((product: any) => product.status === 'published') // Only show published products
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

          setProducts(productsWithReviews);
        } catch (err) {
          // If reviews fetch fails, fall back to the transformed list without ratings
          console.warn('Failed to fetch review summaries:', err);
          setProducts(transformedProducts);
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
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <MoonLoader size={30} color="#a03048" />
          </div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[200px] text-red-500">
            <p>Error loading products: {error}</p>
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </>
  );
}
