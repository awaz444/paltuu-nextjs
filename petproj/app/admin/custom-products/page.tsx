"use client";

import React, { useState, useEffect } from 'react';

interface CustomProduct {
    inventory_id: number;
    vendor_id: number;
    shop_name: string;
    custom_title: string;
    custom_sku: string;
    custom_description: string;
    custom_image_url: string;
    selling_price: number;
    original_price: number;
    stock_count: number;
    is_available: boolean;
}

export default function AdminCustomProductsPage() {
    const [products, setProducts] = useState<CustomProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchCustomProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/v1/admin/custom-products');
            if (!res.ok) throw new Error("Failed to load custom products");
            const data = await res.json();
            setProducts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomProducts();
    }, []);

    const handleToggleAvailability = async (id: number, current: boolean) => {
        try {
            const res = await fetch(`/api/v1/admin/custom-products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_available: !current })
            });
            if (res.ok) {
                setProducts(products.map(p => p.inventory_id === id ? { ...p, is_available: !current } : p));
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="pb-12">
            {/* Header */}
            <div className="mb-8">
                <h2 className="text-2xl font-extrabold text-[#065758] tracking-tight">Vendor Custom Products</h2>
                <p className="text-gray-500 text-sm mt-1">Review products directly created by vendors</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 border border-red-100 font-medium p-4 rounded-xl mb-6">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12 text-gray-500 font-medium animate-pulse">Loading custom products...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
                    No custom products submitted yet.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {products.map((p) => (
                        <div key={p.inventory_id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                            {/* Image */}
                            <div className="w-full h-48 bg-gray-100 flex items-center justify-center relative border-b border-gray-200">
                                {p.custom_image_url ? (
                                    <img src={p.custom_image_url} alt={p.custom_title} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl opacity-30">📦</span>
                                )}
                                <span className="absolute top-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-sm text-white rounded-lg text-xs font-bold">
                                    {p.shop_name}
                                </span>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                                <div>
                                    <h4 className="font-bold text-gray-800 text-base mb-1">{p.custom_title}</h4>
                                    <p className="text-gray-500 text-xs line-clamp-2 mb-4 leading-relaxed">
                                        {p.custom_description || 'No description provided.'}
                                    </p>
                                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-xl text-xs text-gray-600 mb-4 font-medium">
                                        <span>Price: <strong className="text-gray-800 font-bold">PKR {p.selling_price}</strong></span>
                                        <span>Stock: <strong className="text-gray-800 font-bold">{p.stock_count ?? '∞'}</strong></span>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => handleToggleAvailability(p.inventory_id, p.is_available)}
                                    className={`w-full py-2.5 rounded-xl font-semibold text-sm border transition shadow-sm ${
                                        p.is_available 
                                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100 hover:border-red-200' 
                                            : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-100 hover:border-green-200'
                                    }`}
                                >
                                    {p.is_available ? 'Deactivate Product' : 'Activate Product'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
