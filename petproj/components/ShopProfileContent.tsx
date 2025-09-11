"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Row, Col, Divider, Typography, Upload, Avatar } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title } = Typography;

interface ShopProfileData {
  shop_id: number;
  shop_name: string;
  address: string;
  logo_url: string;
  contact: {
    user_id: number;
    name: string;
    email: string;
    phone_number: string;
    profile_image_url: string;
  };
  bank_info: {
    account_title: string;
    iban: string;
    bank_name: string;
  } | null;
  social_media: Array<{
    platform: string;
    url: string;
  }>;
}

interface ShopProfileContentProps {
  shopId: number;
}

export default function ShopProfileContent({ shopId }: ShopProfileContentProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ShopProfileData | null>(null);
  const [socialMedia, setSocialMedia] = useState<Array<{ platform: string; url: string }>>([]);
  const [profileImage, setProfileImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchShopProfile();
  }, [shopId]);

  const fetchShopProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching shop profile for ID:', shopId);
      const response = await fetch(`/api/shops/${shopId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Shop profile data:', data);
        setProfileData(data);
        setSocialMedia(data.social_media || []);
        setProfileImage(data.logo_url || '');
        
        const formValues = {
          shop_name: data.shop_name || '',
          address: data.address || '',
          contact_name: data.contact?.name || '',
          email: data.contact?.email || '',
          phone_number: data.contact?.phone_number || '',
          account_title: data.bank_info?.account_title || '',
          iban: data.bank_info?.iban || '',
          bank_name: data.bank_info?.bank_name || '',
        };
        
        console.log('Setting form values:', formValues);
        form.setFieldsValue(formValues);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        message.error(`Failed to fetch shop profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching shop profile:', error);
      message.error('Error fetching shop profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/shops/${shopId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          social_media: socialMedia,
          logo_url: profileImage,
        }),
      });

      if (response.ok) {
        message.success('Shop profile updated successfully');
        fetchShopProfile();
      } else {
        message.error('Failed to update shop profile');
      }
    } catch (error) {
      console.error('Error updating shop profile:', error);
      message.error('Error updating shop profile');
    } finally {
      setLoading(false);
    }
  };

  const addSocialMedia = () => {
    setSocialMedia([...socialMedia, { platform: '', url: '' }]);
  };

  const removeSocialMedia = (index: number) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  const updateSocialMedia = (index: number, field: 'platform' | 'url', value: string) => {
    const updated = [...socialMedia];
    updated[index][field] = value;
    setSocialMedia(updated);
  };

  const handleImageUpload = async (file: File) => {
    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.imageUrl);
        message.success('Profile picture uploaded successfully!');
      } else {
        message.error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      message.error('Error uploading image');
    } finally {
      setUploadingImage(false);
    }
    return false; // Prevent default upload behavior
  };

  if (loading && !profileData) {
    return (
      <div className="py-6 text-center">
        <div className="text-lg">Loading shop profile...</div>
        <div className="text-sm text-gray-500 mt-2">Fetching data for shop ID: {shopId}</div>
      </div>
    );
  }

  if (!profileData && !loading) {
    return (
      <div className="py-6 text-center">
        <div className="text-lg text-red-500">Failed to load shop profile</div>
        <div className="text-sm text-gray-500 mt-2">Shop ID: {shopId}</div>
        <Button onClick={fetchShopProfile} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Shop Profile Management" className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="space-y-6"
        >
          {/* Shop Basic Information */}
          <div>
            <Title level={4} className="mb-4">Shop Information</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Shop Name"
                  name="shop_name"
                  rules={[{ required: true, message: 'Please enter shop name' }]}
                >
                  <Input size="large" placeholder="Enter shop name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <TextArea rows={3} placeholder="Enter shop address" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Profile Picture */}
          <div>
            <Title level={4} className="mb-4">Shop Logo</Title>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} sm={8}>
                <div className="text-center">
                  <Avatar
                    size={120}
                    src={profileImage}
                    icon={<UserOutlined />}
                    className="mb-4"
                  />
                  <div className="text-sm text-gray-500">Current Logo</div>
                </div>
              </Col>
              <Col xs={24} sm={16}>
                <Upload
                  beforeUpload={handleImageUpload}
                  showUploadList={false}
                  accept="image/*"
                  disabled={uploadingImage}
                >
                  <Button 
                    icon={<UploadOutlined />} 
                    loading={uploadingImage}
                    className="w-full sm:w-auto"
                  >
                    {uploadingImage ? 'Uploading...' : 'Upload New Logo'}
                  </Button>
                </Upload>
                <div className="text-xs text-gray-500 mt-2">
                  Recommended: Square image, at least 200x200 pixels
                </div>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Contact Information */}
          <div>
            <Title level={4} className="mb-4">Contact Information</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Contact Name"
                  name="contact_name"
                  rules={[{ required: true, message: 'Please enter contact name' }]}
                >
                  <Input size="large" placeholder="Enter contact name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[
                    { required: true, message: 'Please enter email' },
                    { type: 'email', message: 'Please enter valid email' }
                  ]}
                >
                  <Input size="large" placeholder="Enter email address" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Phone Number"
                  name="phone_number"
                  rules={[{ required: true, message: 'Please enter phone number' }]}
                >
                  <Input size="large" placeholder="Enter phone number" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Bank Information */}
          <div>
            <Title level={4} className="mb-4">Bank Information</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Account Title"
                  name="account_title"
                  rules={[{ required: true, message: 'Please enter account title' }]}
                >
                  <Input size="large" placeholder="Enter account title" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="IBAN"
                  name="iban"
                  rules={[{ required: true, message: 'Please enter IBAN' }]}
                >
                  <Input size="large" placeholder="Enter IBAN" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Bank Name"
                  name="bank_name"
                  rules={[{ required: true, message: 'Please enter bank name' }]}
                >
                  <Input size="large" placeholder="Enter bank name" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Social Media */}
          <div>
            <Title level={4} className="mb-4">Social Media</Title>
            <div className="space-y-4">
              {socialMedia.map((social, index) => (
                <Card key={index} size="small" className="bg-gray-50">
                  <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={8}>
                      <Form.Item
                        label="Platform"
                        className="mb-0"
                      >
                        <Input
                          size="large"
                          placeholder="e.g., Facebook, Instagram, Twitter"
                          value={social.platform}
                          onChange={(e) => updateSocialMedia(index, 'platform', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={14}>
                      <Form.Item
                        label="URL"
                        className="mb-0"
                      >
                        <Input
                          size="large"
                          placeholder="https://..."
                          value={social.url}
                          onChange={(e) => updateSocialMedia(index, 'url', e.target.value)}
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={2}>
                      <div className="flex justify-center">
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => removeSocialMedia(index)}
                          size="large"
                          className="mt-6"
                        />
                      </div>
                    </Col>
                  </Row>
                </Card>
              ))}
              <Button
                type="dashed"
                onClick={addSocialMedia}
                icon={<PlusOutlined />}
                size="large"
                className="w-full h-12"
              >
                Add Social Media Platform
              </Button>
            </div>
          </div>

          <Divider />

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
              className="px-8"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
}
