"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { message, Form, Input, Button, Card, Upload, Spin } from 'antd';
import { ShopOutlined, UploadOutlined } from '@ant-design/icons';

export default function ShopRegister() {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      message.warning('Please login to register a shop');
      router.push('/login');
      return;
    }
  }, [isAuthenticated, user, router]);

  const handleLogoUpload = (info: any) => {
    if (info.file) {
      setLogoFile(info.file.originFileObj || info.file);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('files', logoFile);
        
        const uploadResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: logoFormData,
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          logoUrl = uploadResult.urls?.[0] || null;
        }
      }

      // Create shop record via API
      const response = await fetch('/api/shops', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          shop_name: values.shop_name,
          address: values.address,
          logo_url: logoUrl,
          user_id: user?.user_id || null
        }),
      });

      if (response.ok) {
        message.success('Shop registered successfully!');
        router.push('/bulk-upload-pets');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Failed to register shop');
      }
      
    } catch (error) {
      console.error('Shop registration error:', error);
      message.error('Failed to register shop. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="shadow-lg">
          <div className="text-center mb-8">
            <ShopOutlined className="text-6xl text-blue-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Register Your Pet Shop
            </h1>
            <p className="text-gray-600">
              Create your shop profile to start uploading pets in bulk
            </p>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className="space-y-6"
          >
            <Form.Item
              name="shop_name"
              label="Shop Name"
              rules={[
                { required: true, message: 'Please enter your shop name' },
                { min: 2, message: 'Shop name must be at least 2 characters' }
              ]}
            >
              <Input 
                placeholder="Enter your shop name" 
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="address"
              label="Shop Address"
              rules={[
                { required: true, message: 'Please enter your shop address' },
                { min: 10, message: 'Please provide a complete address' }
              ]}
            >
              <Input.TextArea 
                placeholder="Enter your complete shop address"
                rows={3}
              />
            </Form.Item>

            <Form.Item
              name="logo"
              label="Shop Logo (Optional)"
            >
              <Upload
                beforeUpload={() => false}
                onChange={handleLogoUpload}
                showUploadList={false}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />} size="large">
                  Upload Logo
                </Button>
              </Upload>
              {logoFile && (
                <p className="text-sm text-gray-500 mt-2">
                  Selected: {logoFile.name}
                </p>
              )}
            </Form.Item>

            <Form.Item className="text-center">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Register Shop
              </Button>
            </Form.Item>
          </Form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have a shop?{' '}
              <button
                onClick={() => router.push('/bulk-upload-pets')}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Go to Bulk Upload
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
