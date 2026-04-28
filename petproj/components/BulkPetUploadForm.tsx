"use client";
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Select,
  Button,
  Upload,
  Card,
  Row,
  Col,
  Switch,
  InputNumber,
  message,
  Progress,
  Space,
  Divider,
  Typography,
  Alert
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  UploadOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';

const { TextArea } = Input;
const { Option } = Select;
const { Title, Text } = Typography;

interface PetFormData {
  pet_name: string;
  pet_type: number;
  pet_breed: string;
  age: number;
  months: number;
  description: string;
  sex: string;
  vaccinated: boolean;
  neutered: boolean;
  price?: number;
  rescue_story?: string;
  images: File[];
}

interface BulkPetUploadFormProps {
  entityType: 'shop' | 'shelter';
  entityId: number;
  entityName: string;
  showPrice: boolean;
  entityAddress?: string;
}

export default function BulkPetUploadForm({
  entityType,
  entityId,
  entityName,
  showPrice,
  entityAddress
}: BulkPetUploadFormProps) {
  const { user } = useAuth();
  const [form] = Form.useForm();
  const [petForms, setPetForms] = useState<PetFormData[]>([
    {
      pet_name: '',
      pet_type: 0,
      pet_breed: entityType === 'shop' ? '' : '', // Only shops can have breed
      age: 0,
      months: 0,
      description: '',
      sex: 'male',
      vaccinated: false,
      neutered: false,
      price: showPrice ? 0 : undefined,
      rescue_story: entityType === 'shelter' ? '' : undefined,
      images: []
    }
  ]);

  const [petCategories, setPetCategories] = useState<Array<{category_id: number, category_name: string}>>([]);
  const [cities, setCities] = useState<Array<{city_id: number, city_name: string}>>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedCount, setUploadedCount] = useState(0);

  useEffect(() => {
    fetchPetCategories();
    fetchCities();
  }, []);

  const fetchPetCategories = async () => {
    try {
      const response = await fetch('/api/v1/pet-categories');
      const data = await response.json();
      if (response.ok) {
        // Handle both old format (data.categories) and new format (data directly)
        setPetCategories(data.categories || data || []);
      } else {
        message.error('Failed to load pet categories');
      }
    } catch (error) {
      console.error('Error fetching pet categories:', error);
      message.error('Failed to load pet categories');
    }
  };

  const fetchCities = async () => {
    try {
      const response = await fetch('/api/v1/cities');
      const data = await response.json();
      if (response.ok) {
        // Handle both old format (data.cities) and new format (data directly)
        setCities(data.cities || data || []);
      } else {
        message.error('Failed to load cities');
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      message.error('Failed to load cities');
    }
  };

  const addPetForm = () => {
    setPetForms([...petForms, {
      pet_name: '',
      pet_type: 0,
      pet_breed: entityType === 'shop' ? '' : '', // Only shops can have breed
      age: 0,
      months: 0,
      description: '',
      sex: 'male',
      vaccinated: false,
      neutered: false,
      price: showPrice ? 0 : undefined,
      rescue_story: entityType === 'shelter' ? '' : undefined,
      images: []
    }]);
  };

  const removePetForm = (index: number) => {
    if (petForms.length > 1) {
      setPetForms(petForms.filter((_, i) => i !== index));
    }
  };

  const updatePetForm = (index: number, field: keyof PetFormData, value: any) => {
    const updatedForms = [...petForms];
    updatedForms[index] = { ...updatedForms[index], [field]: value };
    setPetForms(updatedForms);
  };

  const handleImageUpload = (index: number, fileList: any[]) => {
    const files = fileList.map(file => file.originFileObj || file).filter(Boolean);
    updatePetForm(index, 'images', files);
  };

  const validatePetForm = (petData: PetFormData): string[] => {
    const errors: string[] = [];

    if (!petData.pet_name.trim()) errors.push('Pet name is required');
    if (!petData.pet_type) errors.push('Pet type is required');
    if (!petData.age && !petData.months) errors.push('Age or months is required');
    if (!petData.description.trim()) errors.push('Description is required');
    if (showPrice && (!petData.price || petData.price <= 0)) errors.push('Price is required for shops');
    if (petData.images.length === 0) errors.push('At least one image is required');
    if (petData.images.length > 5) errors.push('Maximum 5 images allowed per pet');

    return errors;
  };

  const handleBulkUpload = async () => {
    // Validate all forms
    const allErrors: string[] = [];
    petForms.forEach((petData, index) => {
      const errors = validatePetForm(petData);
      if (errors.length > 0) {
        allErrors.push(`Pet ${index + 1}: ${errors.join(', ')}`);
      }
    });

    if (allErrors.length > 0) {
      message.error('Please fix the following errors:\n' + allErrors.join('\n'));
      return;
    }

    // Demo mode - actually upload to database
    if (!user?.id && !user?.user_id) {
      message.error('User not authenticated. Please login to upload pets.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setUploadedCount(0);

    try {
      const totalPets = petForms.length;
      let successCount = 0;

      // Process each pet
      for (let i = 0; i < petForms.length; i++) {
        const petData = petForms[i];

        try {
          // Prepare pet data for bulk upload (without images first)
          const petRecord = {
            owner_id: user.id || user.user_id,
            pet_name: petData.pet_name,
            pet_type: petData.pet_type,
            pet_breed: entityType === 'shop' ? (petData.pet_breed || null) : null, // Only shops have breed
            city_id: null, // Will be set by user selection
            area: entityAddress || '',
            age: petData.age || 0,
            months: petData.months || 0,
            description: petData.description,
            adoption_status: 'available',
            price: showPrice ? petData.price : null,
            min_age_of_children: null,
            can_live_with_dogs: null,
            can_live_with_cats: null,
            must_have_someone_home: null,
            energy_level: 3,
            cuddliness_level: 3,
            health_issues: null,
            sex: petData.sex,
            listing_type: showPrice ? 'shop' : 'rescue',
            vaccinated: petData.vaccinated,
            neutered: petData.neutered,
            rescue_story: entityType === 'shelter' ? (petData.rescue_story || null) : null,
            images: [] // Will be uploaded separately
          };

          // Create pet first to get pet_id
          const response = await fetch('/api/v1/pets/bulk-upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              pets: [petRecord],
              entityType,
              entityId
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to upload pet');
          }

          const result = await response.json();

          if (result.success) {
            // Upload images if pet was created successfully and has images
            if (petData.images && petData.images.length > 0) {
              try {
                const petId = result.results[0].pet_id; // Get the created pet ID from results
                await uploadImagesWithPetId(petData.images, petId);
              } catch (imageError) {
                console.error('Error uploading images:', imageError);
                message.warning(`Pet created but images failed to upload for ${petData.pet_name}`);
              }
            }

            successCount++;
            setUploadedCount(successCount);
            setUploadProgress((successCount / totalPets) * 100);
          } else {
            throw new Error(result.error || 'Upload failed');
          }

        } catch (error) {
          console.error(`Error uploading pet ${i + 1}:`, error);
          message.error(`Failed to upload pet ${i + 1}: ${petData.pet_name}`);
        }
      }

      if (successCount > 0) {
        message.success(`Successfully uploaded ${successCount} out of ${totalPets} pets`);
        // Reset forms
        setPetForms([{
          pet_name: '',
          pet_type: 0,
          pet_breed: entityType === 'shop' ? '' : '', // Only shops can have breed
          age: 0,
          months: 0,
          description: '',
          sex: 'male',
          vaccinated: false,
          neutered: false,
          price: showPrice ? 0 : undefined,
          rescue_story: entityType === 'shelter' ? '' : undefined,
          images: []
        }]);
      }

    } catch (error) {
      console.error('Bulk upload error:', error);
      message.error('Bulk upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadedCount(0);
    }
  };

  const uploadImages = async (images: File[]): Promise<string[]> => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('files', image);
    });

    const response = await fetch('/api/v1/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    const result = await response.json();
    return result.urls || [];
  };

  const uploadImagesWithPetId = async (images: File[], petId: number): Promise<string[]> => {
    const formData = new FormData();
    images.forEach(image => {
      formData.append('files', image);
    });
    formData.append('pet_id', petId.toString());

    const response = await fetch('/api/v1/upload-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload images');
    }

    const result = await response.json();
    return result.urls || [];
  };


  return (
    <div className="space-y-6">
      <Alert
        message="Bulk Upload Instructions"
        description={
          <div>
            <p>• Fill in the details for each pet you want to upload</p>
            <p>• Upload 1-5 images per pet (required)</p>
            <p>• {showPrice ? 'Price is required for shop listings' : 'Price is not applicable for rescue listings'}</p>
            <p>• All fields marked with * are required</p>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mb-4"
      />

      {uploading && (
        <Card>
          <div className="text-center">
            <Title level={4}>Uploading Pets...</Title>
            <Progress
              percent={Math.round(uploadProgress)}
              status={uploadProgress === 100 ? 'success' : 'active'}
            />
            <Text>{uploadedCount} of {petForms.length} pets uploaded</Text>
          </div>
        </Card>
      )}

      <div className="space-y-6">
        {petForms.map((petData, index) => (
          <Card
            key={index}
            title={`Pet ${index + 1}`}
            extra={
              petForms.length > 1 && (
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => removePetForm(index)}
                >
                  Remove
                </Button>
              )
            }
            className="border-l-4 border-l-blue-500"
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item label="Pet Name *" required>
                  <Input
                    value={petData.pet_name}
                    onChange={(e) => updatePetForm(index, 'pet_name', e.target.value)}
                    placeholder="Enter pet name"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Pet Type *" required>
                  <Select
                    value={petData.pet_type}
                    onChange={(value) => updatePetForm(index, 'pet_type', value)}
                    placeholder="Select pet type"
                  >
                    {(petCategories || []).map(category => (
                      <Option key={category.category_id} value={category.category_id}>
                        {category.category_name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>

              {entityType === 'shop' && (
                <Col xs={24} sm={12}>
                  <Form.Item label="Breed">
                    <Input
                      value={petData.pet_breed}
                      onChange={(e) => updatePetForm(index, 'pet_breed', e.target.value)}
                      placeholder="Enter breed (optional)"
                    />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} sm={12}>
                <Form.Item label="Sex *" required>
                  <Select
                    value={petData.sex}
                    onChange={(value) => updatePetForm(index, 'sex', value)}
                  >
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item label="Age (Years)">
                  <InputNumber
                    value={petData.age}
                    onChange={(value) => updatePetForm(index, 'age', value || 0)}
                    min={0}
                    max={30}
                    placeholder="0"
                    className="w-full"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={8}>
                <Form.Item label="Age (Months)">
                  <InputNumber
                    value={petData.months}
                    onChange={(value) => updatePetForm(index, 'months', value || 0)}
                    min={0}
                    max={11}
                    placeholder="0"
                    className="w-full"
                  />
                </Form.Item>
              </Col>

              {showPrice && (
                <Col xs={24} sm={8}>
                  <Form.Item label="Price (PKR) *" required>
                    <InputNumber
                      value={petData.price}
                      onChange={(value) => updatePetForm(index, 'price', value || 0)}
                      min={0}
                      placeholder="0"
                      className="w-full"
                      formatter={value => `PKR ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      parser={value => Number(value!.replace(/PKR\s?|(,*)/g, '')) || 0}
                    />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24} sm={12}>
                <Form.Item label="Vaccinated">
                  <Switch
                    checked={petData.vaccinated}
                    onChange={(checked) => updatePetForm(index, 'vaccinated', checked)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12}>
                <Form.Item label="Neutered/Spayed">
                  <Switch
                    checked={petData.neutered}
                    onChange={(checked) => updatePetForm(index, 'neutered', checked)}
                  />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label="Description *" required>
                  <TextArea
                    value={petData.description}
                    onChange={(e) => updatePetForm(index, 'description', e.target.value)}
                    placeholder="Describe the pet's personality, health, and any special needs"
                    rows={3}
                  />
                </Form.Item>
              </Col>

              {entityType === 'shelter' && (
                <Col xs={24}>
                  <Form.Item label="Rescue Story">
                    <TextArea
                      value={petData.rescue_story || ''}
                      onChange={(e) => updatePetForm(index, 'rescue_story', e.target.value)}
                      placeholder="Tell the story of how this pet was rescued - where they were found, what condition they were in, their journey to recovery, etc."
                      rows={4}
                    />
                  </Form.Item>
                </Col>
              )}

              <Col xs={24}>
                <Form.Item label="Images *" required>
                  <Upload
                    multiple
                    listType="picture-card"
                    fileList={petData.images.map((file, i) => ({
                      uid: i.toString(),
                      name: file.name,
                      status: 'done',
                      url: URL.createObjectURL(file)
                    }))}
                    beforeUpload={() => false}
                    onChange={(info) => handleImageUpload(index, info.fileList)}
                    maxCount={5}
                  >
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  </Upload>
                  <Text type="secondary">Upload 1-5 images (max 5MB each)</Text>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between gap-3 items-stretch sm:items-center mt-2">
        <Button
          type="dashed"
          icon={<PlusOutlined />}
          onClick={addPetForm}
          disabled={uploading}
          className="w-full sm:w-auto"
        >
          Add Another Pet
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={() => setPetForms([{
            pet_name: '',
            pet_type: 0,
            pet_breed: entityType === 'shop' ? '' : '', // Only shops can have breed
            age: 0,
            months: 0,
            description: '',
            sex: 'male',
            vaccinated: false,
            neutered: false,
            price: showPrice ? 0 : undefined,
            rescue_story: entityType === 'shelter' ? '' : undefined,
            images: []
          }])} disabled={uploading}>
            Clear All
          </Button>
          <Button
            type="primary"
            icon={<UploadOutlined />}
            onClick={handleBulkUpload}
            loading={uploading}
            disabled={petForms.length === 0}
            className="w-full sm:w-auto"
          >
            Upload {petForms.length} Pet{petForms.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
