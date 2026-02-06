"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/app/store/store";
import { fetchProducts, clearProducts } from "@/app/store/slices/marketplaceSlice";
import ProductGrid from "@/components/ProductGrid";
import { Store, ArrowLeft, CheckCircle, Truck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import Script from "next/script";

// Local Product interface
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

export default function GenericBrandPage() {
    const params = useParams();
    const dispatch = useDispatch<AppDispatch>();
    const { products, loading, error } = useSelector((state: RootState) => state.marketplace);
    const [brandProducts, setBrandProducts] = useState<Product[]>([]);

    // Normalize brand name from params
    const rawBrandName = Array.isArray(params.brandname) ? params.brandname[0] : params.brandname;
    const brandName = rawBrandName ? (rawBrandName.charAt(0).toUpperCase() + rawBrandName.slice(1).replace(/-/g, ' ')) : "Brand";
    const displayName = `${brandName} Products in Pakistan`;

    // SEO UPGRADE: JSON-LD Schema
    const brandSchema = {
        "@context": "https://schema.org",
        "@type": "Brand",
        "name": brandName,
        "description": `Shop ${brandName} pet products in Pakistan. Authentic ${brandName} food and accessories available for delivery in Karachi.`,
        "url": `https://paltuu.pk/marketplace/brands/${rawBrandName}`,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `https://paltuu.pk/marketplace/brands/${rawBrandName}?q={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    useEffect(() => {
        if (brandName) {
            dispatch(clearProducts());
            dispatch(fetchProducts({ page: 1, limit: 50, filters: { keyword: brandName } }));
        }
    }, [dispatch, brandName]);

    useEffect(() => {
        if (products && products.length > 0) {
            // Simple filter to ensure relevance if API returns broad matches
            const filtered = products.filter((product: Product) =>
                product.name.toLowerCase().includes(brandName.toLowerCase()) ||
                product.description?.toLowerCase().includes(brandName.toLowerCase())
            );
            // If strict filtering removes everything (API might be fuzzy), fallback to all returned
            setBrandProducts(filtered.length > 0 ? filtered : products as Product[]);
        }
    }, [products, brandName]);

    return (
        <div className="min-h-screen bg-gray-50">
            <Script
                id="brand-schema"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(brandSchema) }}
            />

            {/* Header Section */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <Link
                        href="/marketplace/brands"
                        className="inline-flex items-center gap-2 text-gray-500 hover:text-primary mb-6 transition-colors font-medium text-sm"
                    >
                        <ArrowLeft size={18} />
                        <span>Back to Brand Directory</span>
                    </Link>

                    <div className="flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-24 h-24 md:w-32 md:h-32 bg-white border border-gray-100 shadow-sm rounded-2xl flex items-center justify-center p-4 flex-shrink-0">
                            <Store size={48} className="text-primary" />
                        </div>

                        <div className="flex-1">
                            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                                Buy {brandName} Online
                            </h1>

                            <p className="text-gray-600 text-lg leading-relaxed mb-4">
                                Shop authentic <span className="font-semibold text-gray-900">{brandName} pet products</span> in Pakistan.
                                We are your official source for quality nutrition and accessories, delivering to
                                <span className="font-semibold text-gray-900"> Karachi</span>.
                            </p>

                            <div className="flex flex-wrap gap-4 text-sm font-medium text-gray-700">
                                <span className="flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full text-white">
                                    <CheckCircle size={16} /> 100% Authentic
                                </span>
                                <span className="flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full text-white">
                                    <Truck size={16} /> Fast Delivery in Karachi
                                </span>
                                <span className="flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full text-white">
                                    <ShieldCheck size={16} /> Fresh Stock Guarantee
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Products Section */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="text-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-gray-600">Loading {brandName} products...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
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
                ) : brandProducts.length > 0 ? (
                    <>
                        <div className="mb-8 flex justify-between items-end border-b border-gray-200 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Available Stock
                                </h2>
                                <p className="text-gray-500 text-sm mt-1">
                                    Browsing {brandProducts.length} items from {brandName}
                                </p>
                            </div>
                        </div>
                        <ProductGrid products={brandProducts} />
                    </>
                ) : (
                    <div className="text-center py-16">
                        <div className="text-gray-400 text-6xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            No {brandName} products found
                        </h3>
                        <p className="text-gray-600 mb-6">
                            We're working on adding more {brandName} products to our collection.
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

            {/* SEO MOAT */}
            <div className="bg-white border-t border-gray-200 mt-12 py-12">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                        Why Choose {brandName}?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8 text-gray-600">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Quality & Trust</h3>
                            <p className="text-sm leading-relaxed">
                                {brandName} is known for its commitment to quality.
                                Providing your pets with the care they deserve through excellent products.
                            </p>
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">{brandName} Price in Karachi</h3>
                            <p className="text-sm leading-relaxed">
                                We offer competitive market rates for all {brandName} products.
                                Enjoy hassle-free online shopping with delivery across Karachi.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}