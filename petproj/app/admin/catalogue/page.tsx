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
        <div style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2.5rem',
            }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Product Catalogue</h2>
                    <p style={{ fontSize: '0.9rem', color: '#8b9bb4', marginTop: '0.5rem', margin: 0 }}>Manage your master product list</p>
                </div>
                <Link href="/admin/catalogue/new" style={{ textDecoration: 'none' }}>
                    <button style={{
                        background: 'linear-gradient(135deg, #f953c6, #b224ef)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(249, 83, 198, 0.4)',
                        transition: 'all 0.3s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(249, 83, 198, 0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(249, 83, 198, 0.4)';
                    }}>
                        + New Product
                    </button>
                </Link>
            </div>

            {/* Filter / Search Bar */}
            <div style={{
                background: 'rgba(22, 27, 34, 0.7)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '2rem',
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap',
                alignItems: 'center',
            }}>
                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: '0.5rem', minWidth: '250px' }}>
                    <input 
                        type="text" 
                        placeholder="Search products, brands..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        style={{
                            flex: 1,
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '10px',
                            padding: '0.75rem 1rem',
                            color: '#ffffff',
                            outline: 'none',
                            fontSize: '0.9rem',
                        }}
                    />
                    <button type="submit" style={{
                        background: '#302b63',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        fontWeight: 600,
                    }}>Search</button>
                </form>

                {/* Filters */}
                <select 
                    value={status} 
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                </select>

                <select 
                    value={animalType} 
                    onChange={(e) => { setAnimalType(e.target.value); setPage(1); }}
                    style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '10px',
                        padding: '0.75rem',
                        color: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                    }}
                >
                    <option value="all">All Animals</option>
                    <option value="cat">Cat</option>
                    <option value="dog">Dog</option>
                    <option value="bird">Bird</option>
                    <option value="fish">Fish</option>
                </select>
            </div>

            {/* Product Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b9bb4' }}>Loading products...</div>
            ) : products.length === 0 ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '3rem', 
                    background: 'rgba(22, 27, 34, 0.5)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '16px',
                    color: '#8b9bb4'
                }}>
                    No products found. Add a new product to get started.
                </div>
            ) : (
                <div style={{
                    background: 'rgba(22, 27, 34, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Image</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Title</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Brand</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Animal</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>SKU</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Variants</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Weight</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((p) => (
                                    <tr key={p.product_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.01)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{
                                                width: '45px',
                                                height: '45px',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}>
                                                {p.images && p.images[0] ? (
                                                    <img src={p.images[0]} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    <span style={{ opacity: 0.3 }}>📦</span>
                                                )}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#ffffff' }}>{p.title}</td>
                                        <td style={{ padding: '1rem', color: '#8b9bb4' }}>{p.brand || '-'}</td>
                                        <td style={{ padding: '1rem', color: '#8b9bb4', textTransform: 'capitalize' }}>{p.animal_type || '-'}</td>
                                        <td style={{ padding: '1rem', color: '#8b9bb4' }}>{p.sku || '-'}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: p.status === 'published' ? 'rgba(46, 213, 115, 0.15)' : p.status === 'draft' ? 'rgba(255, 171, 0, 0.15)' : 'rgba(240, 44, 44, 0.15)',
                                                color: p.status === 'published' ? '#2ed573' : p.status === 'draft' ? '#ffab00' : '#ff6b6b',
                                                textTransform: 'capitalize',
                                            }}>
                                                {p.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#ffffff', fontWeight: 600 }}>{p.variants_count}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {p.shipping_weight ? (
                                                <span style={{ color: '#8b9bb4' }}>{p.shipping_weight}g</span>
                                            ) : (
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    background: 'rgba(255, 171, 0, 0.1)',
                                                    border: '1px solid rgba(255, 171, 0, 0.2)',
                                                    color: '#ffab00',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                }}>⚠️ Needs Weight</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/admin/catalogue/${p.product_id}`} style={{ textDecoration: 'none' }}>
                                                <button style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '8px',
                                                    color: '#ffffff',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                    transition: 'all 0.2s',
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = '#302b63'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; }}>
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
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1.25rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.05)'
                        }}>
                            <button 
                                disabled={page === 1}
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    color: page === 1 ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                                    cursor: page === 1 ? 'not-allowed' : 'pointer'
                                }}
                            >Previous</button>
                            <span style={{ fontSize: '0.9rem', color: '#8b9bb4' }}>Page {page} of {totalPages}</span>
                            <button 
                                disabled={page === totalPages}
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    color: page === totalPages ? 'rgba(255, 255, 255, 0.2)' : '#ffffff',
                                    cursor: page === totalPages ? 'not-allowed' : 'pointer'
                                }}
                            >Next</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
