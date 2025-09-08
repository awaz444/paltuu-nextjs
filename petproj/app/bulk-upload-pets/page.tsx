"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { message, Card, Tabs, Spin } from 'antd';
import Navbar from '../../components/navbar';
import { ShopOutlined, HeartOutlined } from '@ant-design/icons';
import BulkPetUploadForm from '../../components/BulkPetUploadForm';

const { TabPane } = Tabs;

export default function BulkUploadPets() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      console.log('Auth check - isAuthenticated:', isAuthenticated, 'user:', user);
      
      if (!isAuthenticated || !user) {
        console.log('Not authenticated, redirecting to login');
        message.warning('Please login to access this page');
        router.push('/login');
        return;
      }

      // If role isn't shop admin or shelter admin, send them away
      if (user.role !== 'shop admin' && user.role !== 'shelter admin') {
        message.info('This page is only for shop or shelter accounts');
        router.push('/browse-pets');
        return;
      }

      console.log('Authenticated, ready to upload pets');
      setAuthLoading(false);
    };

    // Add a small delay to ensure auth context is fully loaded
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [isAuthenticated, user, router]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin size="large" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Pet Upload
          </h1>
          <p className="text-gray-600">
            Upload multiple pets at once for your shops and rescue shelters
          </p>
        </div>

        {/* Render only the relevant form based on role */}
        {user.role === 'shop admin' && (
          <Card title="Upload Pets for Pet Shop" className="shadow-sm">
            <BulkPetUploadForm
              entityType="shop"
              entityId={1}
              entityName="My Pet Shop"
              showPrice={true}
            />
          </Card>
        )}

        {user.role === 'shelter admin' && (
          <Card title="Upload Pets for Rescue Shelter" className="shadow-sm">
            <BulkPetUploadForm
              entityType="shelter"
              entityId={1}
              entityName="My Rescue Shelter"
              showPrice={false}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
