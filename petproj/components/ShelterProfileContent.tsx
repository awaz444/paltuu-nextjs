"use client";

import React, { useState, useEffect } from "react";
import { Card, Form, Input, Button, message, Row, Col, Divider, Typography, Upload, Avatar } from "antd";
import { SaveOutlined, PlusOutlined, DeleteOutlined, UploadOutlined, UserOutlined } from "@ant-design/icons";

const { TextArea } = Input;
const { Title } = Typography;

interface ShelterProfileData {
  shelter_id: number;
  shelter_name: string;
  address: string;
  description: string;
  logo_url: string;
  capacity: number;
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
  emergency_contacts: {
    primary_phone: string;
    backup_phone: string;
    vet_name: string;
    vet_phone: string;
  } | null;
  social_media: Array<{
    platform: string;
    url: string;
  }>;
  animal_types: Array<{
    id: number;
    name: string;
  }>;
}

interface ShelterProfileContentProps {
  shelterId: number;
}

export default function ShelterProfileContent({ shelterId }: ShelterProfileContentProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ShelterProfileData | null>(null);
  const [socialMedia, setSocialMedia] = useState<Array<{ platform: string; url: string }>>([]);
  const [profileImage, setProfileImage] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [facilityPhotos, setFacilityPhotos] = useState<string[]>([]);
  const [uploadingFacility, setUploadingFacility] = useState(false);

  useEffect(() => {
    fetchShelterProfile();
  }, [shelterId]);

  const fetchShelterProfile = async () => {
    try {
      setLoading(true);
      console.log('Fetching shelter profile for ID:', shelterId);
      const response = await fetch(`/api/v1/rescue/shelters/${shelterId}`);
      console.log('Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Shelter profile data:', data);
        setProfileData(data);
        setSocialMedia(data.social_media || []);
        setProfileImage(data.logo_url || '');
        setFacilityPhotos(data.facility_photos || []);
        
        const formValues = {
          shelter_name: data.shelter_name || '',
          address: data.address || '',
          description: data.description || '',
          capacity: data.capacity || '',
          contact_name: data.contact?.name || '',
          email: data.contact?.email || '',
          phone_number: data.contact?.phone_number || '',
          account_title: data.bank_info?.account_title || '',
          iban: data.bank_info?.iban || '',
          bank_name: data.bank_info?.bank_name || '',
          primary_phone: data.emergency_contacts?.primary_phone || '',
          backup_phone: data.emergency_contacts?.backup_phone || '',
          vet_name: data.emergency_contacts?.vet_name || '',
          vet_phone: data.emergency_contacts?.vet_phone || '',
        };
        
        console.log('Setting form values:', formValues);
        form.setFieldsValue(formValues);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        message.error(`Failed to fetch shelter profile: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching shelter profile:', error);
      message.error('Error fetching shelter profile');
    } finally {
      setLoading(false);
    }
  };

  const handleFacilityUpload = async (file: File) => {
    try {
      setUploadingFacility(true);
      const formData = new FormData();
      formData.append('image', file);

      const uploadRes = await fetch('/api/upload-shelter-image', { method: 'POST', body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json();
        message.error(err.error || 'Failed to upload photo');
        return false;
      }
      const { imageUrl } = await uploadRes.json();

      const saveRes = await fetch(`/api/v1/rescue/shelters/${shelterId}/photos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: imageUrl })
      });
      if (!saveRes.ok) {
        const err = await saveRes.json();
        message.error(err.error || 'Failed to save photo');
        return false;
      }
      setFacilityPhotos((prev) => [imageUrl, ...prev]);
      message.success('Facility photo added');
    } catch (e) {
      message.error('Error adding photo');
    } finally {
      setUploadingFacility(false);
    }
    return false;
  };

  const handleRemoveFacilityPhoto = async (url: string) => {
    try {
      const res = await fetch(`/api/v1/rescue/shelters/${shelterId}/photos`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_url: url })
      });
      if (!res.ok) {
        const err = await res.json();
        message.error(err.error || 'Failed to remove photo');
        return;
      }
      setFacilityPhotos((prev) => prev.filter((p) => p !== url));
      message.success('Photo removed');
    } catch (e) {
      message.error('Error removing photo');
    }
  };

  const handleSave = async (values: any) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/rescue/shelters/${shelterId}`, {
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
        message.success('Shelter profile updated successfully');
        fetchShelterProfile();
      } else {
        message.error('Failed to update shelter profile');
      }
    } catch (error) {
      console.error('Error updating shelter profile:', error);
      message.error('Error updating shelter profile');
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

      const response = await fetch('/api/upload-shelter-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setProfileImage(data.imageUrl);
        message.success('Shelter logo uploaded successfully!');
      } else {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        message.error(`Failed to upload image: ${errorData.error || 'Unknown error'}`);
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
        <div className="text-lg">Loading shelter profile...</div>
        <div className="text-sm text-gray-500 mt-2">Fetching data for shelter ID: {shelterId}</div>
      </div>
    );
  }

  if (!profileData && !loading) {
    return (
      <div className="py-6 text-center">
        <div className="text-lg text-red-500">Failed to load shelter profile</div>
        <div className="text-sm text-gray-500 mt-2">Shelter ID: {shelterId}</div>
        <Button onClick={fetchShelterProfile} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card title="Shelter Profile Management" className="shadow-sm">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          className="space-y-6"
        >
          {/* Shelter Basic Information */}
          <div>
            <Title level={4} className="mb-4">Shelter Information</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Shelter Name"
                  name="shelter_name"
                  rules={[{ required: true, message: 'Please enter shelter name' }]}
                >
                  <Input size="large" placeholder="Enter shelter name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Capacity"
                  name="capacity"
                  rules={[{ required: true, message: 'Please enter capacity' }]}
                >
                  <Input type="number" size="large" placeholder="Enter capacity" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true, message: 'Please enter address' }]}
                >
                  <TextArea rows={3} placeholder="Enter shelter address" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item
                  label="Description"
                  name="description"
                  rules={[{ required: true, message: 'Please enter description' }]}
                >
                  <TextArea rows={4} placeholder="Enter shelter description" />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Facility Photos */}
          <div>
            <Title level={4} className="mb-4">Facility Photos</Title>
            <Row gutter={[16, 16]}>
              {facilityPhotos.map((url, idx) => (
                <Col key={idx} xs={12} sm={8} md={6}>
                  <Card
                    cover={<img src={url} alt={`facility-${idx}`} className="h-36 object-cover" />}
                    actions={[<Button danger type="link" onClick={() => handleRemoveFacilityPhoto(url)} key="remove">Remove</Button>]}
                    className="shadow-sm"
                  />
                </Col>
              ))}
              <Col xs={12} sm={8} md={6}>
                <Upload
                  beforeUpload={handleFacilityUpload}
                  showUploadList={false}
                  accept="image/*"
                  disabled={uploadingFacility}
                >
                  <Button icon={<PlusOutlined />} loading={uploadingFacility} className="w-full h-36 flex items-center justify-center">
                    {uploadingFacility ? 'Uploading...' : 'Add Photo'}
                  </Button>
                </Upload>
              </Col>
            </Row>
          </div>

          <Divider />

          {/* Profile Picture */}
          <div>
            <Title level={4} className="mb-4">Shelter Logo</Title>
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

          {/* Emergency Contacts */}
          <div>
            <Title level={4} className="mb-4">Emergency Contacts</Title>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Primary Phone"
                  name="primary_phone"
                  rules={[{ required: true, message: 'Please enter primary phone' }]}
                >
                  <Input size="large" placeholder="Enter primary phone" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Backup Phone"
                  name="backup_phone"
                >
                  <Input size="large" placeholder="Enter backup phone" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Vet Name"
                  name="vet_name"
                >
                  <Input size="large" placeholder="Enter vet name" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  label="Vet Phone"
                  name="vet_phone"
                >
                  <Input size="large" placeholder="Enter vet phone" />
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
