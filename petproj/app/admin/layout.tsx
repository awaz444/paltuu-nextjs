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
            <div style={{
                minHeight: '100vh',
                background: '#0d1117',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Inter, sans-serif'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Verifying credentials...</div>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#0d1117',
            color: '#c9d1d9',
            fontFamily: 'Inter, sans-serif',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Top Navigation */}
            <header style={{
                background: 'rgba(22, 27, 34, 0.8)',
                backdropFilter: 'blur(12px)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '1rem 2rem',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                    <Link href="/admin" style={{ textDecoration: 'none' }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            background: 'linear-gradient(135deg, #f953c6, #b224ef)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Paltuu Admin</h1>
                    </Link>

                    <nav style={{ display: 'flex', gap: '1.5rem' }}>
                        <Link href="/admin/catalogue" style={{ color: '#8b9bb4', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Catalogue</Link>
                        <Link href="/admin/vendors" style={{ color: '#8b9bb4', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Vendors</Link>
                        <Link href="/admin/custom-products" style={{ color: '#8b9bb4', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Custom Items</Link>
                    </nav>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#8b9bb4' }}>Logged in as: <strong style={{ color: '#ffffff' }}>Admin</strong></span>
                </div>
            </header>

            {/* Content Body */}
            <main style={{ flex: 1, padding: '3rem 2rem' }}>
                {children}
            </main>
        </div>
    );
}
