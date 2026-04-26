"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Product {
    product_id: number;
    title: string;
    description: string;
    brand: string;
    animal_type: string;
    sku: string;
    status: string;
    shipping_weight: number | null;
    variants_count: number;
    images: string[];
}

export default function AdminCataloguePage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('all');
    const [animalType, setAnimalType] = useState('all');
    const [search, setSearch] = useState('');

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const url = `/api/v1/admin/catalogue?page=${page}&limit=10&status=${status}&animal_type=${animalType}&keyword=${encodeURIComponent(search)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setProducts(data.rows);
            setTotalPages(data.meta.totalPages);
        } catch (err) {
            console.error("Error loading products:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, status, animalType]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProducts();
    };

    return (
        <div className="pb-12">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#065758] tracking-tight">Product Catalogue</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage your master product list</p>
                </div>
                <Link href="/admin/catalogue/new">
                    <button className="bg-[#065758] hover:bg-[#043b3c] text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition duration-200">
                        + New Product
                    </button>
                </Link>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex flex-1 gap-2 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search products, brands..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] focus:ring-0 outline-none transition"
                    />
                    <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition">
                        Search
                    </button>
                </form>

                {/* Filters */}
                <div className="flex gap-4 w-full md:w-auto">
                    <select 
                        value={status} 
                        onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 cursor-pointer outline-none focus:border-[#065758] transition"
                    >
                        <option value="all">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>

                    <select 
                        value={animalType} 
                        onChange={(e) => { setAnimalType(e.target.value); setPage(1); }}
                        className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 cursor-pointer outline-none focus:border-[#065758] transition"
                    >
                        <option value="all">All Animals</option>
                        <option value="cat">Cat</option>
                        <option value="dog">Dog</option>
                        <option value="bird">Bird</option>
                        <option value="fish">Fish</option>
                    </select>
                </div>
            </div>

            {/* Product Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-500 font-medium animate-pulse">Loading products...</div>
            ) : products.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
                    No products found. Add a new product to get started.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                                    <th className="p-4">Image</th>
                                    <th className="p-4">Title</th>
                                    <th className="p-4">Brand</th>
                                    <th className="p-4">Animal</th>
                                    <th className="p-4">SKU</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Variants</th>
                                    <th className="p-4">Weight</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {products.map((p) => (
                                    <tr key={p.product_id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4">
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center">
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl opacity-40">📦</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">{p.title}</td>
                                        <td className="p-4 text-gray-500">{p.brand || '-'}</td>
                                        <td className="p-4 text-gray-500 capitalize">{p.animal_type || '-'}</td>
                                        <td className="p-4 text-gray-500 font-mono text-xs">{p.sku || '-'}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs capitalize ${
                                                p.status === 'published' 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : p.status === 'draft' 
                                                    ? 'bg-amber-100 text-amber-700' 
                                                    : 'bg-red-100 text-red-700'
                                            }`}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">{p.variants_count}</td>
                                        <td className="p-4">
                                            {p.shipping_weight ? (
                                                <span className="text-gray-500">{p.shipping_weight}g</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-600 rounded text-xs font-semibold">
                                                    Needs Weight
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <Link href={`/admin/catalogue/${p.product_id}`}>
                                                <button className="bg-white hover:bg-[#065758] hover:text-white border border-gray-200 hover:border-[#065758] font-medium px-3.5 py-1.5 rounded-lg text-xs transition duration-150 shadow-sm">
                                                    Edit
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-between items-center px-6 py-4 bg-gray-50/50 border-t border-gray-200 text-sm">
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                className={`px-4 py-2 border border-gray-200 rounded-xl bg-white font-medium shadow-sm transition ${
                                    page === 1 ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                            >
                                Previous
                            </button>
                            <span className="text-gray-500 font-medium">Page {page} of {totalPages}</span>
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                className={`px-4 py-2 border border-gray-200 rounded-xl bg-white font-medium shadow-sm transition ${
                                    page === totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50'
                                }`}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
