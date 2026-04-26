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

    const cardStyle = {
        background: 'rgba(22, 27, 34, 0.7)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        padding: '2rem',
        textAlign: 'center' as const,
        flex: 1,
        minWidth: '200px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#ffffff' }}>Paltuu Master Admin</h2>
                <p style={{ fontSize: '1rem', color: '#8b9bb4', marginTop: '0.5rem', margin: 0 }}>Overview of business operations and catalog state</p>
            </div>

            {loading ? (
                <div style={{ color: '#8b9bb4', textAlign: 'center', padding: '3rem' }}>Fetching operational parameters...</div>
            ) : (
                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
                    <div style={cardStyle}>
                        <span style={{ fontSize: '1.1rem', color: '#8b9bb4', fontWeight: 600, marginBottom: '0.5rem' }}>Master Products</span>
                        <strong style={{ fontSize: '3rem', color: '#ffffff', fontWeight: 900 }}>{stats.totalProducts}</strong>
                    </div>
                    <div style={cardStyle}>
                        <span style={{ fontSize: '1.1rem', color: '#8b9bb4', fontWeight: 600, marginBottom: '0.5rem' }}>Active Vendors</span>
                        <strong style={{ fontSize: '3rem', color: '#ffffff', fontWeight: 900 }}>{stats.totalVendors}</strong>
                    </div>
                    <div style={cardStyle}>
                        <span style={{ fontSize: '1.1rem', color: '#8b9bb4', fontWeight: 600, marginBottom: '0.5rem' }}>Custom Products</span>
                        <strong style={{ fontSize: '3rem', color: '#ffab00', fontWeight: 900 }}>{stats.customProducts}</strong>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#ffffff', marginBottom: '1.5rem' }}>Management Portals</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
                <Link href="/admin/catalogue" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(249, 83, 198, 0.1), rgba(178, 36, 239, 0.1))',
                        border: '1px solid rgba(249, 83, 198, 0.2)',
                        borderRadius: '16px',
                        padding: '2rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <h4 style={{ color: '#f953c6', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Master Catalogue</h4>
                        <p style={{ color: '#8b9bb4', margin: 0, fontSize: '0.95rem' }}>Update prices, track metrics, manage listings.</p>
                    </div>
                </Link>

                <Link href="/admin/vendors" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(46, 213, 115, 0.1), rgba(46, 134, 222, 0.1))',
                        border: '1px solid rgba(46, 213, 115, 0.2)',
                        borderRadius: '16px',
                        padding: '2rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <h4 style={{ color: '#2ed573', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Vendor Onboarding</h4>
                        <p style={{ color: '#8b9bb4', margin: 0, fontSize: '0.95rem' }}>Approve vendor shops and override regional fees.</p>
                    </div>
                </Link>

                <Link href="/admin/custom-products" style={{ textDecoration: 'none' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(255, 171, 0, 0.1), rgba(249, 83, 198, 0.1))',
                        border: '1px solid rgba(255, 171, 0, 0.2)',
                        borderRadius: '16px',
                        padding: '2rem',
                        cursor: 'pointer',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>
                        <h4 style={{ color: '#ffab00', margin: '0 0 0.5rem 0', fontSize: '1.3rem' }}>Custom Requests</h4>
                        <p style={{ color: '#8b9bb4', margin: 0, fontSize: '0.95rem' }}>Vet product submissions before allowing visibility.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
