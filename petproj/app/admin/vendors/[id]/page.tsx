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

    if (loading) return <div className="text-center py-12 text-gray-500 font-medium animate-pulse">Loading vendor details...</div>;
    if (!vendor) return <div className="text-center py-12 text-red-500 font-medium">Vendor not found.</div>;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/vendors" className="text-gray-500 hover:text-[#065758] font-medium text-sm">
                    ← Back to Vendors
                </Link>
                <h2 className="text-2xl font-extrabold text-[#065758]">
                    {vendor.shop_name}
                </h2>
            </div>

            {error && (
                <div className={`p-4 rounded-xl mb-6 font-medium border text-sm ${
                    error.includes('successfully') 
                        ? 'bg-green-50 text-green-700 border-green-100' 
                        : 'bg-red-50 text-red-600 border-red-100'
                }`}>
                    {error}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl mb-8 max-w-sm">
                {[
                    { id: 'settings', label: 'Settings' },
                    { id: 'delivery', label: 'Delivery Zone' },
                    { id: 'inventory', label: 'Inventory' }
                ].map((t) => (
                    <button
                        key={t.id}
                        onClick={() => setTab(t.id)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-xl transition duration-150 ${
                            tab === t.id 
                                ? 'bg-white text-[#065758] shadow-sm' 
                                : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Tab 1: Settings */}
            {tab === 'settings' && (
                <form onSubmit={handleSaveSettings} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-6 border-b border-gray-100 pb-3">General & Financial Settings</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Shop Name</label>
                            <input 
                                type="text" 
                                value={shopName} 
                                onChange={(e) => setShopName(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                                required 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Address</label>
                            <input 
                                type="text" 
                                value={address} 
                                onChange={(e) => setAddress(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Contact Number</label>
                            <input 
                                type="text" 
                                value={contactNumber} 
                                onChange={(e) => setContactNumber(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">WhatsApp Number</label>
                            <input 
                                type="text" 
                                value={whatsappNumber} 
                                onChange={(e) => setWhatsappNumber(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>

                        <div className="sm:col-span-2 border-b border-gray-100 my-2" />

                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Flat Delivery Fee (PKR)</label>
                            <input 
                                type="number" 
                                value={flatFee} 
                                onChange={(e) => setFlatFee(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Per KG Delivery Fee (PKR)</label>
                            <input 
                                type="number" 
                                value={perKgFee} 
                                onChange={(e) => setPerKgFee(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Free Delivery Threshold (PKR)</label>
                            <input 
                                type="number" 
                                value={freeThreshold} 
                                onChange={(e) => setFreeThreshold(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Platform Fee (%)</label>
                            <input 
                                type="number" 
                                step="0.1" 
                                value={platformFee} 
                                onChange={(e) => setPlatformFee(e.target.value)} 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 sm:col-span-2 mt-2">
                            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isActive} 
                                    onChange={(e) => setIsActive(e.target.checked)} 
                                    className="rounded border-gray-300 text-[#065758] focus:ring-[#065758] cursor-pointer"
                                />
                                Active Account
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700 font-medium cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={isVerified} 
                                    onChange={(e) => setIsVerified(e.target.checked)} 
                                    className="rounded border-gray-300 text-[#065758] focus:ring-[#065758] cursor-pointer"
                                />
                                Verified Vendor
                            </label>
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={saving}
                        className={`w-full py-3 bg-[#065758] hover:bg-[#043b3c] text-white font-semibold rounded-xl mt-8 shadow-sm transition ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {saving ? 'Saving...' : 'Save Vendor Settings'}
                    </button>
                </form>
            )}

            {/* Tab 2: Delivery Zone */}
            {tab === 'delivery' && (
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Delivery Polygon Representation</h3>
                    {vendor.delivery_polygon ? (
                        <pre className="bg-gray-50 p-4 rounded-xl overflow-x-auto text-xs text-gray-600 font-mono">
                            {JSON.stringify(vendor.delivery_polygon, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-gray-400 italic text-sm">No delivery polygon mapped yet by the vendor.</p>
                    )}
                </div>
            )}

            {/* Tab 3: Inventory */}
            {tab === 'inventory' && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    {inventory.length === 0 ? (
                        <p className="text-gray-400 italic text-center py-12 text-sm">Vendor has not added items to inventory.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                                        <th className="p-4">Product Title</th>
                                        <th className="p-4">Original (PKR)</th>
                                        <th className="p-4">Selling (PKR)</th>
                                        <th className="p-4">Stock</th>
                                        <th className="p-4">Status</th>
                                        <th className="p-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-sm">
                                    {inventory.map((item) => (
                                        <tr key={item.inventory_id} className="hover:bg-gray-50/50 transition">
                                            <td className="p-4 font-semibold text-gray-800">
                                                {item.product_title || item.custom_title}
                                            </td>
                                            <td className="p-4 text-gray-500">{item.original_price || '-'}</td>
                                            <td className="p-4 font-semibold text-gray-800">{item.selling_price}</td>
                                            <td className="p-4 text-gray-500">{item.stock_count ?? '∞'}</td>
                                            <td className="p-4">
                                                <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                                                    item.is_available 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {item.is_available ? 'Available' : 'Unavailable'}
                                                </span>
                                            </td>
                                            <td className="p-4 text-right">
                                                <button 
                                                    onClick={() => handleDeactivateInventoryItem(item.inventory_id, item.is_available)}
                                                    className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition duration-150 ${
                                                        item.is_available 
                                                            ? 'bg-red-50 hover:bg-red-100 text-red-600 border-red-100' 
                                                            : 'bg-green-50 hover:bg-green-100 text-green-700 border-green-100'
                                                    }`}
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
