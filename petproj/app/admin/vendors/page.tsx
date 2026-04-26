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

    return (
        <div className="pb-12">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-extrabold text-[#065758] tracking-tight">Vendor Accounts</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage the sellers active on Paltuu</p>
                </div>
                <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-[#065758] hover:bg-[#043b3c] text-white font-semibold py-2.5 px-5 rounded-xl shadow-sm hover:shadow-md transform hover:-translate-y-0.5 transition duration-200"
                >
                    + Create Vendor
                </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                <form onSubmit={handleSearch} className="flex flex-1 gap-2 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="Search vendors by shop name or email..." 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] focus:ring-0 outline-none transition"
                    />
                    <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-xl text-sm transition">
                        Search
                    </button>
                </form>

                <select 
                    value={status} 
                    onChange={(e) => { setStatus(e.target.value); setPage(1); }}
                    className="w-full md:w-auto bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 cursor-pointer outline-none focus:border-[#065758] transition"
                >
                    <option value="all">All Vendors</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="unverified">Unverified</option>
                </select>
            </div>

            {/* Vendor List Table */}
            {loading ? (
                <div className="text-center py-12 text-gray-500 font-medium animate-pulse">Loading vendors...</div>
            ) : vendors.length === 0 ? (
                <div className="text-center py-12 bg-white border border-gray-200 rounded-2xl text-gray-400">
                    No vendors found.
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/75 border-b border-gray-200 text-gray-500 font-semibold text-xs tracking-wider uppercase">
                                    <th className="p-4">Shop Name</th>
                                    <th className="p-4">Owner Email</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Products</th>
                                    <th className="p-4">Joined</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {vendors.map((v) => (
                                    <tr key={v.vendor_id} className="hover:bg-gray-50/50 transition">
                                        <td className="p-4 font-semibold text-gray-800">{v.shop_name}</td>
                                        <td className="p-4 text-gray-500">{v.owner_email}</td>
                                        <td className="p-4">
                                            <span className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                                                v.is_active && v.is_verified 
                                                    ? 'bg-green-100 text-green-700' 
                                                    : !v.is_active 
                                                    ? 'bg-red-100 text-red-700' 
                                                    : 'bg-amber-100 text-amber-700'
                                            }`}>
                                                {v.is_active && v.is_verified ? 'Active' : !v.is_active ? 'Inactive' : 'Unverified'}
                                            </span>
                                        </td>
                                        <td className="p-4 font-semibold text-gray-800">{v.products_count}</td>
                                        <td className="p-4 text-gray-500">{new Date(v.created_at).toLocaleDateString()}</td>
                                        <td className="p-4 text-right">
                                            <Link href={`/admin/vendors/${v.vendor_id}`}>
                                                <button className="bg-white hover:bg-[#065758] hover:text-white border border-gray-200 hover:border-[#065758] font-medium px-3.5 py-1.5 rounded-lg text-xs transition duration-150 shadow-sm">
                                                    View
                                                </button>
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
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-md p-6 relative shadow-xl">
                        <button 
                            onClick={() => setIsCreateModalOpen(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-medium text-xl"
                        >
                            ×
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-6">Create Vendor Account</h3>
                        
                        {error && (
                            <div className="bg-red-50 text-red-600 border border-red-100 text-sm font-medium p-3 rounded-xl mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleCreateVendor} className="space-y-4">
                            <div>
                                <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Shop Name *</label>
                                <input 
                                    type="text" 
                                    value={shopName} 
                                    onChange={(e) => setShopName(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Owner Email *</label>
                                <input 
                                    type="email" 
                                    value={email} 
                                    onChange={(e) => setEmail(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                                    required 
                                />
                            </div>

                            <div>
                                <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Temporary Password *</label>
                                <input 
                                    type="password" 
                                    value={password} 
                                    onChange={(e) => setPassword(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                                    required 
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
                                <label className="block text-gray-600 font-semibold text-xs uppercase mb-1">Address</label>
                                <input 
                                    type="text" 
                                    value={address} 
                                    onChange={(e) => setAddress(e.target.value)} 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-800 focus:border-[#065758] outline-none transition" 
                                />
                            </div>

                            <button 
                                type="submit" 
                                disabled={saving}
                                className={`w-full py-3 bg-[#065758] hover:bg-[#043b3c] text-white font-semibold rounded-xl mt-6 shadow-sm transition ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {saving ? 'Creating...' : 'Create Vendor'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
