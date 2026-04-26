"use client";

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isHydrating } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isHydrating) {
            if (!isAuthenticated || user?.role !== 'admin') {
                router.push('/auth');
            }
        }
    }, [isHydrating, isAuthenticated, user, router]);

    if (isHydrating || !isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center font-sans">
                <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#065758]"></div>
                    <div className="text-gray-600 font-semibold text-lg">Verifying credentials...</div>
                </div>
            </div>
        );
    }

    return (
        <div data-role="admin" className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
            {/* Top Navigation */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 px-6 py-4 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-8">
                    <Link href="/admin">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-[#065758] to-[#043b3c] bg-clip-text text-transparent">
                            Paltuu Admin
                        </h1>
                    </Link>

                    <nav className="flex gap-6">
                        <Link href="/admin/catalogue" className="text-gray-600 hover:text-[#065758] font-semibold text-sm transition duration-200">
                            Catalogue
                        </Link>
                        <Link href="/admin/vendors" className="text-gray-600 hover:text-[#065758] font-semibold text-sm transition duration-200">
                            Vendors
                        </Link>
                        <Link href="/admin/custom-products" className="text-gray-600 hover:text-[#065758] font-semibold text-sm transition duration-200">
                            Custom Items
                        </Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4 bg-gray-100 px-4 py-2 rounded-full text-sm">
                    <span className="text-gray-500">Logged in as:</span>
                    <strong className="text-[#065758] font-bold">Admin</strong>
                </div>
            </header>

            {/* Content Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
