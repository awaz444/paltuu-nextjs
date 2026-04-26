"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Variant {
    variant_id?: number;
    title: string;
    sku: string;
    price_override: number | string;
    weight_override: number | string;
    stock: number;
    attributes: any;
    is_default: boolean;
}

interface Media {
    media_id: number;
    url: string;
    alt_text: string;
    ordering: number;
    is_primary: boolean;
}

export default function AdminProductForm({ params }: { params: { id: string } }) {
    const router = useRouter();
    const isNew = params.id === 'new';

    // Form State
    const [title, setTitle] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [brand, setBrand] = useState('');
    const [animalType, setAnimalType] = useState('all');
    const [status, setStatus] = useState('draft');
    
    const [shippingWeight, setShippingWeight] = useState<number | string>('');
    const [minOrderQty, setMinOrderQty] = useState<number>(1);
    const [maxOrderQty, setMaxOrderQty] = useState<number | string>('');

    // Media & Variants State (Loaded only if editing)
    const [media, setMedia] = useState<Media[]>([]);
    const [variants, setVariants] = useState<Variant[]>([]);
    const [newMediaUrl, setNewMediaUrl] = useState('');

    const [loading, setLoading] = useState(!isNew);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (title && isNew && !slug) {
            setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
        }
    }, [title]);

    useEffect(() => {
        if (!isNew) {
            fetchProductData();
        }
    }, [params.id]);

    const fetchProductData = async () => {
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}`);
            if (!res.ok) throw new Error("Failed to load product data");
            const data = await res.json();
            
            setTitle(data.title || '');
            setSlug(data.slug || '');
            setDescription(data.description || '');
            setBrand(data.brand || '');
            setAnimalType(data.animal_type || 'all');
            setStatus(data.status || 'draft');
            setShippingWeight(data.shipping_weight || '');
            setMinOrderQty(data.min_order_qty || 1);
            setMaxOrderQty(data.max_order_qty || '');

            setMedia(data.media || []);
            setVariants(data.variants || []);
        } catch (err: any) {
            setError(err.message || "Failed to load product");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!title) {
            setError('Title is required');
            return;
        }

        if (!shippingWeight) {
            setError('Shipping Weight is required');
            return;
        }

        setSaving(true);
        try {
            const url = isNew ? '/api/v1/admin/catalogue' : `/api/v1/admin/catalogue/${params.id}`;
            const method = isNew ? 'POST' : 'PUT';
            
            const payload = {
                title, slug, description, brand, animal_type: animalType,
                status, shipping_weight: Number(shippingWeight),
                min_order_qty: Number(minOrderQty),
                max_order_qty: maxOrderQty ? Number(maxOrderQty) : null,
            };

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to save product");
            }

            const savedProduct = await res.json();

            if (isNew) {
                router.push(`/admin/catalogue/${savedProduct.product_id}`);
            } else {
                setError('Product updated successfully!');
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const handleAddMedia = async () => {
        if (!newMediaUrl) return;
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}/media`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newMediaUrl, ordering: media.length + 1 })
            });
            if (!res.ok) throw new Error("Failed to add media");
            const savedMedia = await res.json();
            setMedia([...media, savedMedia]);
            setNewMediaUrl('');
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteMedia = async (mediaId: number) => {
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}/media/${mediaId}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete media");
            setMedia(media.filter(m => m.media_id !== mediaId));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleAddVariant = async () => {
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}/variants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: 'New Variant',
                    sku: '',
                    price_override: 0,
                    weight_override: 0,
                    stock: 0,
                    attributes: {}
                })
            });
            if (!res.ok) throw new Error("Failed to add variant");
            const savedVariant = await res.json();
            setVariants([...variants, savedVariant]);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleUpdateVariant = async (vid: number, updatedFields: Partial<Variant>) => {
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}/variants/${vid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedFields)
            });
            if (!res.ok) throw new Error("Failed to update variant");
            const savedVariant = await res.json();
            setVariants(variants.map(v => v.variant_id === vid ? savedVariant : v));
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteVariant = async (vid: number) => {
        try {
            const res = await fetch(`/api/v1/admin/catalogue/${params.id}/variants/${vid}`, {
                method: 'DELETE'
            });
            if (!res.ok) throw new Error("Failed to delete variant");
            setVariants(variants.filter(v => v.variant_id !== vid));
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (loading) return <div style={{ color: '#8b9bb4', textAlign: 'center', padding: '3rem' }}>Loading product details...</div>;

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        background: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '10px',
        color: '#1f2937',
        outline: 'none',
        fontSize: '0.95rem',
    };

    const sectionStyle = {
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: '16px',
        padding: '1.5rem',
        marginBottom: '2rem',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/catalogue" className="text-gray-500 hover:text-[#065758] font-medium text-sm">
                    ← Back to Catalogue
                </Link>
                <h2 className="text-2xl font-extrabold text-[#065758]">
                    {isNew ? 'Create Master Product' : 'Edit Product'}
                </h2>
            </div>

            {error && (
                <div style={{
                    padding: '1rem',
                    background: error.includes('successfully') ? 'rgba(46, 213, 115, 0.15)' : 'rgba(240, 44, 44, 0.15)',
                    border: `1px solid ${error.includes('successfully') ? '#2ed573' : '#ff6b6b'}`,
                    color: error.includes('successfully') ? '#2ed573' : '#ff6b6b',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    fontWeight: 600,
                }}>{error}</div>
            )}

            <form onSubmit={handleSaveProduct}>
                {/* Section 1: Basic Info */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 1.25rem 0', color: '#065758', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                        Section 1 — Basic Info
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Title *</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Slug</label>
                            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Brand</label>
                            <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Animal Type</label>
                            <select value={animalType} onChange={(e) => setAnimalType(e.target.value)} style={inputStyle}>
                                <option value="cat">Cat</option>
                                <option value="dog">Dog</option>
                                <option value="bird">Bird</option>
                                <option value="fish">Fish</option>
                                <option value="all">All</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Status</label>
                            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                                <option value="draft">Draft</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Description</label>
                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, height: '120px', resize: 'vertical' }} />
                        </div>
                    </div>
                </div>

                {/* Section 2: Weight & Shipping */}
                <div style={sectionStyle}>
                    <h3 style={{ margin: '0 0 1.25rem 0', color: '#065758', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                        Section 2 — Weight & Shipping
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: shippingWeight ? '#8b9bb4' : '#ff6b6b' }}>
                                Shipping Weight (grams) *
                            </label>
                            <input 
                                type="number" 
                                value={shippingWeight} 
                                onChange={(e) => setShippingWeight(e.target.value)} 
                                style={{ ...inputStyle, border: shippingWeight ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #ff6b6b' }} 
                                required 
                            />
                            {!shippingWeight && <span style={{ fontSize: '0.75rem', color: '#ff6b6b' }}>Required for delivery fee calculations</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Min Order Qty</label>
                            <input type="number" value={minOrderQty} onChange={(e) => setMinOrderQty(Number(e.target.value))} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Max Order Qty</label>
                            <input type="number" value={maxOrderQty} onChange={(e) => setMaxOrderQty(e.target.value)} style={inputStyle} />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={saving}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: 'linear-gradient(135deg, #f953c6, #b224ef)',
                        border: 'none',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: '1rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(249, 83, 198, 0.4)',
                        marginBottom: '2rem'
                    }}
                >
                    {saving ? 'Saving...' : isNew ? 'Create Product' : 'Update Product'}
                </button>
            </form>

            {!isNew && (
                <>
                    {/* Section 3: Media */}
                    <div style={sectionStyle}>
                        <h3 style={{ margin: '0 0 1.25rem 0', color: '#065758', fontWeight: 700, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.5rem' }}>
                            Section 3 — Media
                        </h3>
                        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <input 
                                type="text" 
                                placeholder="Enter image URL..." 
                                value={newMediaUrl} 
                                onChange={(e) => setNewMediaUrl(e.target.value)} 
                                style={inputStyle} 
                            />
                            <button 
                                type="button" 
                                onClick={handleAddMedia}
                                style={{
                                    background: '#302b63',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0 1.5rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 600,
                                }}
                            >Add</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '1rem' }}>
                            {media.map((m) => (
                                <div key={m.media_id} style={{
                                    position: 'relative',
                                    borderRadius: '12px',
                                    overflow: 'hidden',
                                    background: 'rgba(0,0,0,0.3)',
                                    aspectRatio: '1',
                                    border: m.is_primary ? '2px solid #f953c6' : '1px solid rgba(255,255,255,0.1)'
                                }}>
                                    <img src={m.url} alt={m.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <button 
                                        onClick={() => handleDeleteMedia(m.media_id)}
                                        style={{
                                            position: 'absolute',
                                            top: '5px',
                                            right: '5px',
                                            background: 'rgba(240, 44, 44, 0.8)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '24px',
                                            height: '24px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                        }}
                                    >×</button>
                                    {m.is_primary && (
                                        <span style={{
                                            position: 'absolute',
                                            bottom: '5px',
                                            left: '5px',
                                            background: '#f953c6',
                                            color: 'white',
                                            fontSize: '0.65rem',
                                            padding: '0.2rem 0.4rem',
                                            borderRadius: '4px',
                                            fontWeight: 600
                                        }}>Primary</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Section 4: Variants */}
                    <div style={sectionStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.5rem' }}>
                            <h3 style={{ margin: 0, color: '#065758', fontWeight: 700 }}>Section 4 — Variants</h3>
                            <button 
                                type="button" 
                                onClick={handleAddVariant}
                                style={{
                                    background: '#302b63',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: 600
                                }}
                            >+ Add Variant</button>
                        </div>

                        {variants.length === 0 ? (
                            <p style={{ color: '#8b9bb4', fontStyle: 'italic', margin: 0 }}>No variants created for this product yet.</p>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', color: '#8b9bb4', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <th style={{ padding: '0.75rem' }}>Title</th>
                                            <th style={{ padding: '0.75rem' }}>SKU</th>
                                            <th style={{ padding: '0.75rem' }}>Price Override</th>
                                            <th style={{ padding: '0.75rem' }}>Weight Override</th>
                                            <th style={{ padding: '0.75rem' }}>Stock</th>
                                            <th style={{ padding: '0.75rem' }}>Default</th>
                                            <th style={{ padding: '0.75rem' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {variants.map((v) => (
                                            <tr key={v.variant_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="text" 
                                                        value={v.title} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { title: e.target.value })} 
                                                        style={{ ...inputStyle, padding: '0.4rem' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="text" 
                                                        value={v.sku || ''} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { sku: e.target.value })} 
                                                        style={{ ...inputStyle, padding: '0.4rem' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="number" 
                                                        value={v.price_override || ''} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { price_override: e.target.value })} 
                                                        style={{ ...inputStyle, padding: '0.4rem' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="number" 
                                                        value={v.weight_override || ''} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { weight_override: e.target.value })} 
                                                        style={{ ...inputStyle, padding: '0.4rem' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="number" 
                                                        value={v.stock} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { stock: Number(e.target.value) })} 
                                                        style={{ ...inputStyle, padding: '0.4rem' }} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={v.is_default} 
                                                        onChange={(e) => handleUpdateVariant(v.variant_id!, { is_default: e.target.checked })} 
                                                    />
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteVariant(v.variant_id!)}
                                                        style={{
                                                            background: 'rgba(240, 44, 44, 0.1)',
                                                            border: '1px solid rgba(240, 44, 44, 0.2)',
                                                            color: '#ff6b6b',
                                                            borderRadius: '6px',
                                                            padding: '0.4rem 0.8rem',
                                                            cursor: 'pointer',
                                                            fontSize: '0.8rem',
                                                        }}
                                                    >Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
