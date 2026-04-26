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
    contact_number: string;
    whatsapp_number: string;
    address: string;
    area: string;
    city_id: number;
    logo_url: string;
    flat_delivery_fee: number;
    per_kg_delivery_fee: number;
    max_delivery_weight_kg: number;
    free_delivery_threshold: number;
    platform_fee_percent: number;
    delivery_polygon: any;
    created_at: string;
}

interface InventoryItem {
    inventory_id: number;
    product_title: string;
    selling_price: number;
    original_price: number;
    stock_count: number;
    is_available: boolean;
    custom_title: string;
}

export default function AdminVendorDetailPage({ params }: { params: { id: string } }) {
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('settings'); // settings, delivery, inventory
    const [error, setError] = useState('');
    const [saving, setSaving] = useState(false);

    // Editable Vendor State
    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [contactNumber, setContactNumber] = useState('');
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [flatFee, setFlatFee] = useState<number | string>('');
    const [perKgFee, setPerKgFee] = useState<number | string>('');
    const [freeThreshold, setFreeThreshold] = useState<number | string>('');
    const [platformFee, setPlatformFee] = useState<number | string>('');
    const [isActive, setIsActive] = useState(false);
    const [isVerified, setIsVerified] = useState(false);

    useEffect(() => {
        fetchVendorData();
        fetchInventory();
    }, [params.id]);

    const fetchVendorData = async () => {
        try {
            const res = await fetch(`/api/v1/admin/vendors/${params.id}`);
            if (!res.ok) throw new Error("Failed to load vendor");
            const data = await res.json();
            setVendor(data);

            setShopName(data.shop_name || '');
            setAddress(data.address || '');
            setContactNumber(data.contact_number || '');
            setWhatsappNumber(data.whatsapp_number || '');
            setFlatFee(data.flat_delivery_fee || 0);
            setPerKgFee(data.per_kg_delivery_fee || 0);
            setFreeThreshold(data.free_delivery_threshold || 0);
            setPlatformFee(data.platform_fee_percent || 0);
            setIsActive(data.is_active);
            setIsVerified(data.is_verified);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchInventory = async () => {
        try {
            const res = await fetch(`/api/v1/admin/vendors/${params.id}/inventory`);
            if (res.ok) {
                const data = await res.json();
                setInventory(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);

        try {
            const res = await fetch(`/api/v1/admin/vendors/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shop_name: shopName,
                    address,
                    contact_number: contactNumber,
                    whatsapp_number: whatsappNumber,
                    flat_delivery_fee: Number(flatFee),
                    per_kg_delivery_fee: Number(perKgFee),
                    free_delivery_threshold: Number(freeThreshold),
                    platform_fee_percent: Number(platformFee),
                    is_active: isActive,
                    is_verified: isVerified
                })
            });

            if (!res.ok) throw new Error("Failed to save settings");
            setError('Settings updated successfully!');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeactivateInventoryItem = async (iid: number, currentAvailable: boolean) => {
        try {
            await fetch(`/api/v1/admin/vendors/${params.id}/inventory/${iid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_available: !currentAvailable })
            });
            fetchInventory();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div style={{ color: '#8b9bb4', textAlign: 'center', padding: '3rem' }}>Loading vendor details...</div>;
    if (!vendor) return <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '3rem' }}>Vendor not found.</div>;

    const inputStyle = {
        width: '100%',
        padding: '0.75rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '10px',
        color: '#ffffff',
        outline: 'none',
        fontSize: '0.95rem',
    };

    const tabStyle = (active: boolean) => ({
        padding: '0.75rem 1.5rem',
        cursor: 'pointer',
        fontWeight: 600,
        borderRadius: '10px',
        background: active ? 'linear-gradient(135deg, rgba(249, 83, 198, 0.15), rgba(178, 36, 239, 0.15))' : 'transparent',
        border: active ? '1px solid rgba(249, 83, 198, 0.3)' : '1px solid transparent',
        color: active ? '#ffffff' : '#8b9bb4',
        transition: 'all 0.3s ease',
    });

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <Link href="/admin/vendors" style={{ textDecoration: 'none', color: '#8b9bb4' }}>
                    ← Back to Vendors
                </Link>
                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>
                    {vendor.shop_name}
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

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '2.5rem' }}>
                <div style={tabStyle(tab === 'settings')} onClick={() => setTab('settings')}>Settings</div>
                <div style={tabStyle(tab === 'delivery')} onClick={() => setTab('delivery')}>Delivery Zone</div>
                <div style={tabStyle(tab === 'inventory')} onClick={() => setTab('inventory')}>Inventory</div>
            </div>

            {/* Tab 1: Settings */}
            {tab === 'settings' && (
                <form onSubmit={handleSaveSettings} style={{
                    background: 'rgba(22, 27, 34, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '2rem',
                }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff' }}>General & Financial Settings</h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Shop Name</label>
                            <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} style={inputStyle} required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Address</label>
                            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Contact Number</label>
                            <input type="text" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>WhatsApp Number</label>
                            <input type="text" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ gridColumn: 'span 2', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', margin: '1rem 0' }} />

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Flat Delivery Fee (PKR)</label>
                            <input type="number" value={flatFee} onChange={(e) => setFlatFee(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Per KG Delivery Fee (PKR)</label>
                            <input type="number" value={perKgFee} onChange={(e) => setPerKgFee(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Free Delivery Threshold (PKR)</label>
                            <input type="number" value={freeThreshold} onChange={(e) => setFreeThreshold(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#8b9bb4' }}>Platform Fee (%)</label>
                            <input type="number" step="0.1" value={platformFee} onChange={(e) => setPlatformFee(e.target.value)} style={inputStyle} />
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', gridColumn: 'span 2', marginTop: '1rem' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                                Active Account
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', cursor: 'pointer' }}>
                                <input type="checkbox" checked={isVerified} onChange={(e) => setIsVerified(e.target.checked)} />
                                Verified Vendor
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={saving}
                        style={{
                            width: '100%',
                            padding: '0.85rem',
                            background: 'linear-gradient(135deg, #f953c6, #b224ef)',
                            border: 'none',
                            borderRadius: '10px',
                            color: '#ffffff',
                            fontWeight: 600,
                            cursor: 'pointer',
                            marginTop: '2rem'
                        }}
                    >
                        {saving ? 'Saving...' : 'Save Vendor Settings'}
                    </button>
                </form>
            )}

            {/* Tab 2: Delivery Zone */}
            {tab === 'delivery' && (
                <div style={{
                    background: 'rgba(22, 27, 34, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    padding: '2rem',
                }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', color: '#ffffff' }}>Delivery Polygon Representation</h3>
                    {vendor.delivery_polygon ? (
                        <pre style={{
                            background: 'rgba(0,0,0,0.3)',
                            padding: '1.25rem',
                            borderRadius: '12px',
                            overflowX: 'auto',
                            color: '#2ed573',
                            fontSize: '0.85rem'
                        }}>
                            {JSON.stringify(vendor.delivery_polygon, null, 2)}
                        </pre>
                    ) : (
                        <p style={{ color: '#8b9bb4', fontStyle: 'italic' }}>No delivery polygon mapped yet by the vendor.</p>
                    )}
                </div>
            )}

            {/* Tab 3: Inventory */}
            {tab === 'inventory' && (
                <div style={{
                    background: 'rgba(22, 27, 34, 0.7)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}>
                    {inventory.length === 0 ? (
                        <p style={{ color: '#8b9bb4', fontStyle: 'italic', padding: '2rem', margin: 0 }}>Vendor has not added items to inventory.</p>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Product Title</th>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Original (PKR)</th>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Selling (PKR)</th>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Stock</th>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Status</th>
                                        <th style={{ padding: '1rem', color: '#8b9bb4', fontSize: '0.85rem' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((item) => (
                                        <tr key={item.inventory_id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.03)' }}>
                                            <td style={{ padding: '1rem', color: '#ffffff', fontWeight: 600 }}>
                                                {item.product_title || item.custom_title}
                                            </td>
                                            <td style={{ padding: '1rem', color: '#8b9bb4' }}>{item.original_price || '-'}</td>
                                            <td style={{ padding: '1rem', color: '#ffffff' }}>{item.selling_price}</td>
                                            <td style={{ padding: '1rem', color: '#8b9bb4' }}>{item.stock_count ?? '∞'}</td>
                                            <td style={{ padding: '1rem' }}>
                                                <span style={{
                                                    padding: '0.25rem 0.5rem',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    background: item.is_available ? 'rgba(46, 213, 115, 0.15)' : 'rgba(240, 44, 44, 0.15)',
                                                    color: item.is_available ? '#2ed573' : '#ff6b6b'
                                                }}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <button 
                                                    onClick={() => handleDeactivateInventoryItem(item.inventory_id, item.is_available)}
                                                    style={{
                                                        background: 'rgba(255, 255, 255, 0.05)',
                                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                                        padding: '0.4rem 0.8rem',
                                                        borderRadius: '6px',
                                                        color: item.is_available ? '#ff6b6b' : '#2ed573',
                                                        cursor: 'pointer',
                                                        fontSize: '0.8rem',
                                                    }}
                                                >
                                                    {item.is_available ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
