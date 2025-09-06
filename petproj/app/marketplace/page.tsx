"use client";
import { useEffect, useState } from "react";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import Navbar from "../../components/navbar";
import MarketplaceFilterSection from "@/components/MarketplaceFilterSection";
import ProductGrid from "@/components/ProductGrid";
import "./styles.css";
import { MoonLoader } from "react-spinners";

// First, let's define the Product interface
interface Product {
    product_id: number;
    name: string;
    description: string;
    price: string;
    original_price?: string; // Optional field for pre-discount price
    category: string;
    collection: string;
    image_url: string;
}

// Then update the mock data with some discounted items
const mockProducts: Product[] = [
    {
        product_id: 1,
        name: "Premium Dog Collar",
        description: "High quality leather collar for medium to large dogs",
        price: "1499",
        original_price: "1999", // 25% off
        category: "Accessories",
        collection: "Dogs",
        image_url: "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/collar.jpg"
    },
    {
        product_id: 2,
        name: "Cat Scratching Post",
        description: "Durable sisal rope scratching post with platform",
        price: "2999",
        original_price: "3499", // ~14% off
        category: "Furniture",
        collection: "Cats",
        image_url: "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/scratch-post.jpg"
    },
    {
        product_id: 3,
        name: "Bird Cage Feeder",
        description: "Automatic bird feeder with multiple compartments",
        price: "899",
        category: "Food & Water", // No discount on this item
        collection: "Birds",
        image_url: "https://res.cloudinary.com/dfwykqn1d/image/upload/v1/marketplace/bird-feeder.jpg"
    }
];

export default function Marketplace() {
    useSetPrimaryColor();

    // Update the state type
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        category: "",
        collection: "",
        keyword: "",
    });

    useEffect(() => {
        // Simulate API fetch with mock data
        const fetchProducts = async () => {
            try {
                // Simulate network delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                setProducts(mockProducts);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();

        // Commented out original API fetch
        /*
        const fetchProducts = async () => {
            try {
                const response = await fetch("/api/marketplace");
                if (!response.ok) throw new Error("Failed to fetch products");
                const data = await response.json();
                setProducts(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
        */
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

    const filteredProducts = products.filter((product: any) => {
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

    const [primaryColor, setPrimaryColor] = useState("#A00000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    return (
        <>
            <Navbar />
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <MarketplaceFilterSection
                    filters={filters}
                    onSearch={handleSearch}
                    onReset={handleReset}
                />
                <ProductGrid products={filteredProducts} />
            </div>
        </>
    );
}