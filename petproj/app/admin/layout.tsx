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

            {/* Content Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
                {children}
            </main>
        </div>
    );
}
