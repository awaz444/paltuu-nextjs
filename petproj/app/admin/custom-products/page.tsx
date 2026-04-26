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
        <div style={{ paddingBottom: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Vendor Custom Products</h2>
                <p style={{ fontSize: '0.9rem', color: '#8b9bb4', marginTop: '0.5rem', margin: 0 }}>Review products directly created by vendors</p>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: 'rgba(240, 44, 44, 0.15)',
                    border: '1px solid #ff6b6b',
                    color: '#ff6b6b',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    fontWeight: 600,
                }}>{error}</div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b9bb4' }}>Loading custom products...</div>
            ) : products.length === 0 ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '3rem', 
                    background: 'rgba(22, 27, 34, 0.5)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '16px',
                    color: '#8b9bb4'
                }}>
                    No custom products submitted yet.
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem',
                }}>
                    {products.map((p) => (
                        <div key={p.inventory_id} style={{
                            background: 'rgba(22, 27, 34, 0.7)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            borderRadius: '16px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                        }}>
                            {/* Image */}
                            <div style={{
                                width: '100%',
                                height: '200px',
                                background: 'rgba(0,0,0,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                position: 'relative'
                            }}>
                                {p.custom_image_url ? (
                                    <img src={p.custom_image_url} alt={p.custom_title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <span style={{ fontSize: '3rem', opacity: 0.2 }}>📦</span>
                                )}
                                <span style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    padding: '0.25rem 0.6rem',
                                    background: 'rgba(0,0,0,0.6)',
                                    borderRadius: '6px',
                                    fontSize: '0.75rem',
                                    color: '#2ed573',
                                    fontWeight: 600,
                                    border: '1px solid rgba(46, 213, 115, 0.3)'
                                }}>{p.shop_name}</span>
                            </div>

                            {/* Details */}
                            <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffffff', fontSize: '1.1rem' }}>{p.custom_title}</h4>
                                    <p style={{ margin: '0 0 1rem 0', color: '#8b9bb4', fontSize: '0.85rem', lineHeight: '1.4' }}>
                                        {p.custom_description || 'No description provided.'}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', fontSize: '0.9rem' }}>
                                        <span style={{ color: '#8b9bb4' }}>Price: <strong style={{ color: '#ffffff' }}>PKR {p.selling_price}</strong></span>
                                        <span style={{ color: '#8b9bb4' }}>Stock: <strong style={{ color: '#ffffff' }}>{p.stock_count ?? '∞'}</strong></span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button 
                                        onClick={() => handleToggleAvailability(p.inventory_id, p.is_available)}
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem',
                                            background: p.is_available ? 'rgba(240, 44, 44, 0.15)' : 'rgba(46, 213, 115, 0.15)',
                                            border: `1px solid ${p.is_available ? '#ff6b6b' : '#2ed573'}`,
                                            color: p.is_available ? '#ff6b6b' : '#2ed573',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        {p.is_available ? 'Deactivate' : 'Activate Product'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
