"use client";
import { useEffect, useState } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import MarketplaceFilterSection from "@/components/MarketplaceFilterSection";
import ProductGrid from "@/components/ProductGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";

// Product interface
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
  rating?: number;       // ⭐ average rating (0–5)
  ratingCount?: number;  // number of reviews
}

// Mock data with ratings
const mockProducts: Product[] = [
  {
    product_id: 1,
    name: "Premium Dog Collar",
    description: "High quality leather collar for medium to large dogs",
    price: "1499",
    original_price: "1999",
    category: "Accessories",
    collection: "Dogs",
    image_url:
      "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/collar.jpg",
    inStock: true,
    rating: 5,
    ratingCount: 32,
  },
  {
    product_id: 2,
    name: "Cat Scratching Post",
    description: "Durable sisal rope scratching post with platform",
    price: "2999",
    original_price: "3499",
    category: "Furniture",
    collection: "Cats",
    image_url:
      "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/scratch-post.jpg",
    inStock: true,
    rating: 4,
    ratingCount: 18,
  },
  {
    product_id: 3,
    name: "Bird Cage Feeder",
    description: "Automatic bird feeder with multiple compartments",
    price: "899",
    category: "Food & Water",
    collection: "Birds",
    image_url:
      "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/bird-feeder.jpg",
    inStock: true,
    rating: 3,
    ratingCount: 7,
  },
];

export default function Marketplace() {
  useSetPrimaryColor();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    category: "",
    collection: "",
    keyword: "",
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate delay
        setProducts(mockProducts);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
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
      <Navbar />
      <div
        className="fullBody"
        style={{ maxWidth: "90%", margin: "0 auto" }}
      >
        <MarketplaceFilterSection
          filters={filters}
          onSearch={handleSearch}
          onReset={handleReset}
        />
        {loading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <MoonLoader size={30} color="#a03048" />
          </div>
        ) : (
          <ProductGrid products={filteredProducts} />
        )}
      </div>
    </>
  );
}
