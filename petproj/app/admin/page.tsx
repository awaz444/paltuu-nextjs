"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalVendors: 0,
        customProducts: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [prodRes, vendRes, custRes] = await Promise.all([
                    fetch('/api/v1/admin/catalogue?limit=1'),
                    fetch('/api/v1/admin/vendors?limit=1'),
                    fetch('/api/v1/admin/custom-products')
                ]);

                const prodData = await prodRes.json();
                const vendData = await vendRes.json();
                const custData = await custRes.json();

                setStats({
                    totalProducts: prodData.meta?.total || 0,
                    totalVendors: vendData.meta?.total || 0,
                    customProducts: custData.length || 0
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    return (
        <div className="max-w-6xl mx-auto pb-12">
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold text-[#065758] tracking-tight">Paltuu Master Admin</h2>
                    <p className="text-gray-500 text-sm mt-1">Overview of business operations and catalog state</p>
                </div>
                <Link href="/admin-panel">
                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-xl text-sm border border-gray-200 transition">
                        ← Back to Admin Panel
                    </button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center text-gray-500 py-12 animate-pulse text-lg font-medium">Fetching operational parameters...</div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-gray-400 font-semibold text-sm mb-2">Master Products</span>
                        <strong className="text-4xl font-extrabold text-[#065758]">{stats.totalProducts}</strong>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-gray-400 font-semibold text-sm mb-2">Active Vendors</span>
                        <strong className="text-4xl font-extrabold text-[#065758]">{stats.totalVendors}</strong>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-gray-400 font-semibold text-sm mb-2">Custom Products</span>
                        <strong className="text-4xl font-extrabold text-orange-500">{stats.customProducts}</strong>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <h3 className="text-xl font-bold text-gray-700 mb-6">Management Portals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/admin/catalogue">
                    <div className="bg-gradient-to-br from-[#065758]/10 to-[#043b3c]/5 border border-[#065758]/20 hover:border-[#065758] hover:shadow-md rounded-2xl p-6 cursor-pointer transform hover:-translate-y-1 transition duration-200">
                        <h4 className="text-[#065758] font-bold text-lg mb-1">Master Catalogue</h4>
                        <p className="text-gray-500 text-sm">Update prices, track metrics, manage listings.</p>
                    </div>
                </Link>

                <Link href="/admin/vendors">
                    <div className="bg-gradient-to-br from-[#065758]/10 to-[#043b3c]/5 border border-[#065758]/20 hover:border-[#065758] hover:shadow-md rounded-2xl p-6 cursor-pointer transform hover:-translate-y-1 transition duration-200">
                        <h4 className="text-[#065758] font-bold text-lg mb-1">Vendor Onboarding</h4>
                        <p className="text-gray-500 text-sm">Approve vendor shops and override regional fees.</p>
                    </div>
                </Link>

                <Link href="/admin/custom-products">
                    <div className="bg-gradient-to-br from-[#065758]/10 to-[#043b3c]/5 border border-[#065758]/20 hover:border-[#065758] hover:shadow-md rounded-2xl p-6 cursor-pointer transform hover:-translate-y-1 transition duration-200">
                        <h4 className="text-[#065758] font-bold text-lg mb-1">Custom Requests</h4>
                        <p className="text-gray-500 text-sm">Vet product submissions before allowing visibility.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
