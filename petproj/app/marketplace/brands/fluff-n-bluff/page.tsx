"use client";

import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchProducts } from "@/app/store/slices/marketplaceSlice";
import ProductGrid from "@/components/ProductGrid";
import { Store, ArrowLeft } from "lucide-react";
import Link from "next/link";

// Local Product interface to match ProductGrid's expected structure
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

export default function FluffNBluffBrandPage() {
    const dispatch = useDispatch<AppDispatch>();
    const { products, loading, error } = useSelector((state: RootState) => state.marketplace);
    const [brandProducts, setBrandProducts] = useState<Product[]>([]);

    const brandName = "Fluff'n Bluff";
    const displayName = "Fluff'n Bluff";

    useEffect(() => {
        // Fetch products with Fluff'n Bluff keyword
        dispatch(fetchProducts({
            page: 1,
            limit: 50,
            filters: { keyword: brandName }
        }));
    }, [dispatch, brandName]);

    useEffect(() => {
        // Filter products that match the brand name
        if (products && products.length > 0) {
            const filtered = products.filter((product: Product) =>
                product.name.toLowerCase().includes(brandName.toLowerCase()) ||
                product.description?.toLowerCase().includes(brandName.toLowerCase())
            );
            setBrandProducts(filtered);
        }
    }, [products, brandName]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading {displayName} products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">⚠️</div>
                    <p className="text-gray-800 font-semibold text-lg mb-2">
                        Oops! Something went wrong
                    </p>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {/* Back Button */}
                    <Link
                        href="/marketplace/brands"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-6 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span>Back to All Brands</span>
                    </Link>

                    {/* Centered Brand Heading and Slug */}
                    <div className="text-center mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            {displayName}
                        </h1>
                        <p className="text-primary font-medium text-lg">fluff-n-bluff</p>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center">
                            <Store size={32} className="text-primary" />
                        </div>
                        <div>
                            <p className="text-primary font-medium">Playful pet accessories</p>
                        </div>
                    </div>

                    <p className="text-gray-600 text-lg max-w-3xl">
                        Fluff'n Bluff specializes in premium pet grooming products and accessories designed to keep your pets looking and feeling their best. Our comprehensive range includes shampoos, conditioners, brushes, nail care tools, and styling accessories for professional-quality grooming at home.
                    </p>
                </div>
            </div>

            {/* Products Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {brandProducts.length > 0 ? (
                    <>
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                {displayName} Products
                            </h2>
                            <p className="text-gray-600">
                                Showing {brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <ProductGrid products={brandProducts} />
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No {displayName} products found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            We're working on adding more {displayName} products to our collection.
                        </p>
                        <Link
                            href="/marketplace"
                            className="bg-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
                        >
                            Browse All Products
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}