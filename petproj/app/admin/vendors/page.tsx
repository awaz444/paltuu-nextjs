"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Vendor {
    vendor_id: number;
    shop_name: string;
    owner_email: string;
    owner_name: string;
    is_active: boolean;
    is_verified: boolean;
    products_count: number;
    created_at: string;
}

export default function AdminVendorsPage() {
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [status, setStatus] = useState('all');
    const [search, setSearch] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    // Create Vendor Form State
    const [shopName, setShopName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [address, setAddress] = useState('');
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    const fetchVendors = async () => {
        setLoading(true);
        try {
            const url = `/api/v1/admin/vendors?page=${page}&limit=10&status=${status}&keyword=${encodeURIComponent(search)}`;
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to load");
            const data = await res.json();
            setVendors(data.rows);
            setTotalPages(data.meta.totalPages);
        } catch (err) {
            console.error("Error loading vendors:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, [page, status]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchVendors();
    };

    const handleCreateVendor = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const res = await fetch('/api/v1/admin/vendors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_name: shopName,
                    email,
                    password,
                    contact_number: contactNumber,
                    whatsapp_number: whatsappNumber,
                    address
                })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.error || "Failed to create vendor");
            }

            // Reset state
            setShopName('');
            setEmail('');
            setPassword('');
            setContactNumber('');
            setWhatsappNumber('');
            setAddress('');
            setIsCreateModalOpen(false);
            fetchVendors();
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setSaving(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#ffffff',
        outline: 'none',
        fontSize: '0.95rem',
        marginBottom: '1rem',
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
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Vendor Accounts</h2>
                    <p style={{ fontSize: '0.9rem', color: '#8b9bb4', marginTop: '0.5rem', margin: 0 }}>Manage the sellers active on Paltuu</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{
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
                >
                    + Create Vendor
                </button>
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
                <form onSubmit={handleSearch} style={{ display: 'flex', flex: 1, gap: '0.5rem', minWidth: '250px' }}>
                    <input 
                        type="text" 
                        placeholder="Search vendors by shop name or email..." 
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
                    <option value="all">All Vendors</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="unverified">Unverified</option>
                </select>
            </div>

            {/* Vendor List Table */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#8b9bb4' }}>Loading vendors...</div>
            ) : vendors.length === 0 ? (
                <div style={{
                    textAlign: 'center', 
                    padding: '3rem', 
                    background: 'rgba(22, 27, 34, 0.5)', 
                    border: '1px solid rgba(255, 255, 255, 0.05)', 
                    borderRadius: '16px',
                    color: '#8b9bb4'
                }}>
                    No vendors found.
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
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Shop Name</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Owner Email</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Status</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Products</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Joined</th>
                                    <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem', fontWeight: 600 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vendors.map((v) => (
                                    <tr key={v.vendor_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '1rem', fontWeight: 600, color: '#ffffff' }}>{v.shop_name}</td>
                                        <td style={{ padding: '1rem', color: '#8b9bb4' }}>{v.owner_email}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                padding: '0.25rem 0.6rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: v.is_active && v.is_verified ? 'rgba(46, 213, 115, 0.15)' : !v.is_active ? 'rgba(240, 44, 44, 0.15)' : 'rgba(255, 171, 0, 0.15)',
                                                color: v.is_active && v.is_verified ? '#2ed573' : !v.is_active ? '#ff6b6b' : '#ffab00',
                                            }}>
                                                {v.is_active && v.is_verified ? 'Active' : !v.is_active ? 'Inactive' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', color: '#ffffff', fontWeight: 600 }}>{v.products_count}</td>
                                        <td style={{ padding: '1rem', color: '#8b9bb4' }}>{new Date(v.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <Link href={`/admin/vendors/${v.vendor_id}`} style={{ textDecoration: 'none' }}>
                                                <button style={{
                                                    background: 'rgba(255, 255, 255, 0.05)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    padding: '0.4rem 0.8rem',
                                                    borderRadius: '8px',
                                                    color: '#ffffff',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem',
                                                }}>View</button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Vendor Modal */}
            {isCreateModalOpen && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 200,
                    padding: '1rem',
                }}>
                    <div style={{
                        background: '#161b22',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '16px',
                        width: '100%',
                        maxWidth: '500px',
                        padding: '2rem',
                        position: 'relative'
                    }}>
                        <button 
                            onClick={() => setIsCreateModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: '#8b9bb4', fontSize: '1.5rem', cursor: 'pointer' }}
                        >×</button>

                        <h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff', fontSize: '1.5rem' }}>Create Vendor Account</h3>
                        
                        {error && <div style={{ color: '#ff6b6b', background: 'rgba(240, 44, 44, 0.1)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontWeight: 600 }}>{error}</div>}

                        <form onSubmit={handleCreateVendor}>
                            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Shop Name *</label>
                            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} style={inputStyle} required />

                            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Owner Email *</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} required />

                            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Temporary Password *</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} required />

                            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Contact Number</label>
                            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={inputStyle} />

                            <label style={{ display: 'block', marginBottom: '0.25rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Address</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />

                            <button 
                                type="submit" 
                                disabled={saving}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, #f953c6, #b224ef)',
                                    border: 'none',
                                    color: '#ffffff',
                                    fontWeight: 600,
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    marginTop: '0.5rem',
                                }}
                            >{saving ? 'Creating...' : 'Create Vendor'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
