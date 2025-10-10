"use client";
import { useEffect, useState, Suspense } from "react";
import { MoonLoader } from "react-spinners";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import {
  fetchProducts,
  clearProducts,
} from "@/app/store/slices/marketplaceSlice";
import { useSearchParams, useRouter } from "next/navigation";
import ProductFilterSection from "@/components/ProductFilterSection";
import ProductGrid from "@/components/ProductGrid";
import { ArrowLeft } from "lucide-react";
import "./styles.css";

// Disable Next.js automatic scroll reset
if (typeof window !== "undefined" && "scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

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

function MarketplaceClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, error, meta } = useSelector(
    (s: RootState) => s.marketplace
  );

  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialCategorySlug = searchParams.get("categorySlug") || "";
  const initialSortBy = searchParams.get("sortBy") || "";
  const initialKeyword = searchParams.get("keyword") || "";
  const initialPetType = searchParams.get("petType") || "";

  const [page, setPage] = useState(initialPage);
  const [filters, setFilters] = useState({
    keyword: initialKeyword,
    sortBy: initialSortBy,
    categorySlug: initialCategorySlug,
    petType: initialPetType,
  });

  // ✅ Save scroll before navigating to product detail
  const handleProductClick = (productId: number) => {
    sessionStorage.setItem("marketplace-scroll", window.scrollY.toString());
    sessionStorage.setItem("marketplace-from-product", "true");
    router.push(`/marketplace/${productId}`);
  };

  // ✅ Fetch products whenever filters/page change
  useEffect(() => {
    dispatch(clearProducts());
    dispatch(fetchProducts({ page, limit: 25, filters }));

    const params = new URLSearchParams({
      page: page.toString(),
      ...(filters.keyword && { keyword: filters.keyword }),
      ...(filters.categorySlug && { categorySlug: filters.categorySlug }),
      ...(filters.sortBy && { sortBy: filters.sortBy }),
      ...(filters.petType && { petType: filters.petType }),
    });
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [page, filters, dispatch]);

  // ✅ Scroll management: restore exact scroll after returning from product page
  useEffect(() => {
    const fromProduct = sessionStorage.getItem("marketplace-from-product");
    const savedScroll = sessionStorage.getItem("marketplace-scroll");

    if (fromProduct && savedScroll) {
      const scrollY = parseInt(savedScroll, 10);
      let restored = false;

      const tryRestore = () => {
        // Wait until products + images are ready
        if (
          document.readyState === "complete" &&
          document.body.scrollHeight >= scrollY &&
          !loading &&
          products.length > 0
        ) {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: "instant" });
          }, 150); // small delay to let layout settle
          restored = true;
          sessionStorage.removeItem("marketplace-scroll");
          sessionStorage.removeItem("marketplace-from-product");
        }
      };

      const interval = setInterval(() => {
        if (!restored) tryRestore();
        else clearInterval(interval);
      }, 100);

      setTimeout(() => clearInterval(interval), 3000);
      return () => clearInterval(interval);
    } else {
      // Normal behavior when filters or pagination change
      if (products.length > 0 && !loading) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  }, [products, loading]);

  // ✅ Reset filters
  const handleReset = () => {
    const newFilters = {
      keyword: "",
      sortBy: "",
      categorySlug: "",
      petType: "",
    };
    setFilters(newFilters);
    setPage(1);
  };

  // ✅ Search with new filters
  const handleSearch = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 0;

  return (
    <div className="fullBody">
      <Link
        href="/bazaar"
        className="inline-flex items-center mt-2 gap-2 text-primary font-medium hover:text-blue-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Go Back to Bazaar
      </Link>

      <ProductFilterSection
        filters={filters}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      {/* ✅ Pass click handler for scroll memory */}
      <ProductGrid products={products} onProductClick={handleProductClick} />

      {/* ✅ Loader */}
      {loading && (
        <div className="flex justify-center items-center py-6">
          <MoonLoader size={24} color="#a03048" />
        </div>
      )}

      {/* ✅ Error */}
      {error && (
        <div className="flex justify-center items-center min-h-[200px] text-red-500">
          <p>Error loading products: {error}</p>
        </div>
      )}

      {/* ✅ Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center mt-10 mb-6 space-x-2 flex-wrap">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-200 text-primary font-medium hover:bg-gray-300 rounded-2xl disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1 rounded-2xl transition-all duration-150 ${
                page === num
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-200 text-primary font-medium hover:bg-gray-300"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-200 text-primary font-medium hover:bg-gray-300 rounded-2xl disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default function Marketplace() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen">
          <MoonLoader size={30} color="#a03048" />
        </div>
      }
    >
      <MarketplaceClient />
    </Suspense>
  );
}
