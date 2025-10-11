"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { message, Card, Tabs, Spin } from 'antd';
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
        router.push('/auth');
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
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bulk Pet Upload
          </h1>
          <p className="text-gray-600">
            Upload multiple pets at once for your shops and rescue shelters
          </p>
        </div>

        <Tabs defaultActiveKey="shops" type="card">
          <TabPane
            tab={
              <span>
                <ShopOutlined />
                Pet Shop
              </span>
            }
            key="shops"
          >
            <Card title="Upload Pets for Pet Shop" className="shadow-sm">
              <BulkPetUploadForm
                entityType="shop"
                entityId={1} // Use a default ID for demo
                entityName="My Pet Shop"
                showPrice={true}
              />
            </Card>
          </TabPane>

          <TabPane
            tab={
              <span>
                <HeartOutlined />
                Rescue Shelter
              </span>
            }
            key="shelters"
          >
            <Card title="Upload Pets for Rescue Shelter" className="shadow-sm">
              <BulkPetUploadForm
                entityType="shelter"
                entityId={1} // Use a default ID for demo
                entityName="My Rescue Shelter"
                showPrice={false}
              />
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
}
