'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Form, Select, Modal, Input, Upload, Image } from 'antd';
import type { UploadFile, UploadProps } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { formatAge } from '@/utils/formatAge';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchCities } from '../store/slices/citiesSlice';
import { fetchFosterPets } from '../store/slices/fosterPetsSlice';
import { fetchAdoptionPets } from '../store/slices/adoptionPetsSlice';

type Pet = {
  pet_id: number;
  owner_id: number;
  pet_name: string | null;
  pet_type: number | null;
  pet_breed: string | null;
  city_id: number | null;
  area: string;
  age_months: number | null;
  contact_number: string | null;
  description: string | null;
  adoption_status: string;
  price: number | null;
  min_age_of_children: number | null;
  can_live_with_dogs: boolean;
  can_live_with_cats: boolean;
  must_have_someone_home: boolean;
  health_issues: string | null;
  sex: string;
  listing_type: string;
  vaccinated: boolean;
  neutered: boolean;
  approved: boolean;
  images?: { image_id?: number; image_url: string; order?: number }[];
};

const AdminPetInteraction: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [showConfirm, setShowConfirm] = useState<{ pet_id: number | null; show: boolean }>({ pet_id: null, show: false });
  const [sortBy, setSortBy] = useState<string>("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const dispatch = useDispatch<AppDispatch>();
  const { cities } = useSelector((state: RootState) => state.cities);

  useEffect(() => {
    if (editingPet && editingPet.images) {
      setFileList(
        editingPet.images.map((img) => ({
          uid: String(img.image_id || img.image_url),
          name: img.image_url.split('/').pop() || 'image.png',
          status: 'done',
          url: img.image_url,
        }))
      );
    } else {
      setFileList([]);
    }
  }, [editingPet]);

  useEffect(() => {
    // Fetch cities and pets in parallel for better performance
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/v1/admin/pets');
        if (!response.ok) {
          throw new Error('Failed to fetch pets');
        }
        const data: Pet[] = await response.json();
        setPets(data);
        setFilteredPets(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    // Fetch cities if not already loaded in Redux
    if (!cities || cities.length === 0) {
      dispatch(fetchCities());
    }
    fetchData();
  }, [dispatch, cities.length]);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...pets];

    // Filter by status
    if (statusFilter !== "all") {
      result = result.filter((pet) => pet.adoption_status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((pet) => pet.listing_type === typeFilter);
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        (pet) =>
          pet.pet_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pet.pet_breed?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === "newest") {
        return b.pet_id - a.pet_id; // Assuming higher ID = newer
      } else if (sortBy === "oldest") {
        return a.pet_id - b.pet_id;
      } else if (sortBy === "name") {
        return (a.pet_name || "").localeCompare(b.pet_name || "");
      }
      return 0;
    });

    setFilteredPets(result);
  }, [pets, sortBy, statusFilter, typeFilter, searchTerm]);

  // Delete pet
  const handleDelete = async (petId: number) => {
    setLoading(true);

    dispatch(fetchAdoptionPets({}));
    dispatch(fetchFosterPets());

    try {
      const response = await fetch(`/api/v1/admin/pets?pet_id=${petId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        message.error(`Delete failed: ${errorData.message || 'Unknown error'}`);
      } else {
        message.success('Pet deleted successfully.');
        setPets((prevPets) => prevPets.filter((pet) => pet.pet_id !== petId));
      }
    } catch (error) {
      message.error('Error deleting pet.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmation = (petId: number) => {
    setShowConfirm({ pet_id: petId, show: true });
  };

  const confirmDelete = async (petId: number) => {
    await handleDelete(petId);
    setShowConfirm({ pet_id: null, show: false });
  };

  const cancelDelete = () => {
    setShowConfirm({ pet_id: null, show: false });
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error("You can only upload image files!");
      return Upload.LIST_IGNORE;
    }
    const isSmallEnough = file.size / 1024 / 1024 < 5; // 5MB max size
    if (!isSmallEnough) {
      message.error("Image must be smaller than 5MB!");
      return Upload.LIST_IGNORE;
    }
    return false;
  };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const handleUpdate = async () => {
    if (!editingPet) return;

    setLoading(true);
    try {
      const newFiles = fileList.filter(file => file.originFileObj);
      const existingFiles = fileList.filter(file => !file.originFileObj);

      let uploadedUrls: string[] = [];
      if (newFiles.length > 0) {
        const formData = new FormData();
        newFiles.forEach((file) => {
          if (file.originFileObj) {
            formData.append("files", file.originFileObj);
          }
        });
        
        const uploadRes = await fetch("/api/v1/upload-image", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload new images");
        }
        const uploadData = await uploadRes.json();
        uploadedUrls = uploadData.urls || [];
      }

      const finalImages = [
        ...existingFiles.map(file => ({
          image_id: isNaN(Number(file.uid)) ? undefined : Number(file.uid),
          image_url: file.url!,
        })),
        ...uploadedUrls.map(url => ({
          image_url: url,
        }))
      ];

      const response = await fetch('/api/v1/admin/pets', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editingPet,
          images: finalImages,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        message.error(`Update failed: ${errorData.message || 'Unknown error'}`);
      } else {
        message.success('Pet updated successfully.');
        const updatedData = await response.json();
        setPets((prevPets) =>
          prevPets.map((pet) =>
            pet.pet_id === editingPet.pet_id ? { ...pet, ...updatedData } : pet
          )
        );
        setEditingPet(null); // Close the edit modal
      }
    } catch (error: any) {
      message.error(error.message || 'Error updating pet.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingPet(null); // Close the edit modal
  };

  const columns = [
    {
      title: 'Pet ID',
      dataIndex: 'pet_id',
      key: 'pet_id',
      responsive: ['md'] as any,
    },
    {
      title: 'Image',
      dataIndex: 'images',
      key: 'images',
      render: (images: any[]) => {
        const url = images && images.length > 0 ? images[0].image_url : null;
        return url ? (
          <Image
            src={url}
            alt="Pet"
            width={50}
            height={50}
            className="object-cover rounded-md"
            fallback="/placeholder-pet.png"
          />
        ) : (
          <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-400">
            No Image
          </div>
        );
      },
    },
    {
      title: 'Pet Name',
      dataIndex: 'pet_name',
      key: 'pet_name',
      render: (name: string | null) => (name ? name : 'N/A'),
    },
    {
      title: 'Type',
      dataIndex: 'pet_type',
      key: 'pet_type',
      responsive: ['sm'] as any,
      render: (type: number | null) => {
        if (type === 1) return 'Dog';
        if (type === 2) return 'Cat';
        if (type === 3) return 'Bird';
        return 'N/A';
      }
    },
    {
      title: 'Breed',
      dataIndex: 'pet_breed',
      key: 'pet_breed',
      responsive: ['lg'] as any,
    },
    {
      title: 'Age',
      dataIndex: 'age_months',
      key: 'age_months',
      responsive: ['md'] as any,
      render: (age_months: number | null) => (age_months !== null ? formatAge(age_months) : 'N/A'),
    },
    {
      title: 'Sex',
      dataIndex: 'sex',
      key: 'sex',
      responsive: ['sm'] as any,
    },
    {
      title: 'City',
      dataIndex: 'city_id',
      key: 'city_id',
      responsive: ['lg'] as any,
      render: (cityId: number) => {
        const cityName = cities.find(city => city.city_id === cityId)?.city_name || 'Unknown';
        return cityName;
      },
    },

    {
      title: 'Vaccinated',
      dataIndex: 'vaccinated',
      key: 'vaccinated',
      responsive: ['md'] as any,
      render: (vaccinated: boolean) => (vaccinated ? 'Yes' : 'No'),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as any,
      render: (_: any, record: Pet) => (
        <Space size="small">
          <Button
            className="bg-primary text-white rounded-lg"
            size="small"
            onClick={() => setEditingPet(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this pet?"
            onConfirm={() => confirmDelete(record.pet_id)}
            onCancel={cancelDelete}
            okText="Yes"
            cancelText="No"
          >
            <Button className="bg-red-500 text-white rounded-lg" size="small">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>

      <div className="bg-gray-100 min-h-screen px-4 md:px-10 py-8">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Admin Pet Management</h1>

          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium mb-2">Search Pets</label>
                <Input
                  placeholder="Search by name or breed"
                  allowClear
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Adoption Status</label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="available">Available</Select.Option>
                  <Select.Option value="adopted">Adopted</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Listing Type</label>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  className="w-full"
                >
                  <Select.Option value="all">All Types</Select.Option>
                  <Select.Option value="adoption">Adoption</Select.Option>
                  <Select.Option value="foster">Foster</Select.Option>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select
                  value={sortBy}
                  onChange={setSortBy}
                  className="w-full"
                >
                  <Select.Option value="newest">Newest First</Select.Option>
                  <Select.Option value="oldest">Oldest First</Select.Option>
                  <Select.Option value="name">Name (A-Z)</Select.Option>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredPets.length} of {pets.length} pets
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              columns={columns}
              dataSource={filteredPets}
              rowKey="pet_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} pets`,
                responsive: true,
              }}
              scroll={{ x: 768 }}
            />
          </div>
        </div>

        {/* Edit Modal */}
        <Modal
          title="Edit Pet Listing"
          visible={!!editingPet}
          onCancel={handleCancel}
          onOk={handleUpdate}
          okText="Update"
          cancelText="Cancel"
        >
          <Form layout="vertical" initialValues={editingPet || undefined}>
            <Form.Item label="Upload Pictures (Maximum 5)">
              <Upload
                action=""
                listType="picture-card"
                fileList={fileList}
                beforeUpload={beforeUpload}
                onPreview={handlePreview}
                onChange={handleChange}
                maxCount={5}
              >
                {fileList.length >= 5 ? null : (
                  <button style={{ border: 0, background: "none" }} type="button">
                    <PlusOutlined />
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </button>
                )}
              </Upload>
              {previewImage && (
                <Image
                  wrapperStyle={{ display: "none" }}
                  preview={{
                    visible: previewOpen,
                    onVisibleChange: (visible) => setPreviewOpen(visible),
                    afterOpenChange: (visible) => !visible && setPreviewImage(""),
                  }}
                  src={previewImage}
                />
              )}
            </Form.Item>

            <Form.Item label="Pet Name" required>
              <Input
                placeholder="Pet Name"
                value={editingPet?.pet_name || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, pet_name: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item label="Pet Type" required>
              <Select
                value={editingPet?.pet_type}
                onChange={(value) =>
                  setEditingPet((prev) => ({ ...prev!, pet_type: value }))
                }
              >
                <Select.Option value={1}>Dog</Select.Option>
                <Select.Option value={2}>Cat</Select.Option>
                <Select.Option value={3}>Bird</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Pet Breed" required>
              <Input
                placeholder="Pet Breed"
                value={editingPet?.pet_breed || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, pet_breed: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item label="Description">
              <Input.TextArea
                placeholder="Description"
                value={editingPet?.description || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, description: e.target.value }))
                }
              />
            </Form.Item>
            <Form.Item label="Adoption Status">
              <Select
                value={editingPet?.adoption_status}
                onChange={(value) =>
                  setEditingPet((prev) => ({ ...prev!, adoption_status: value }))
                }
              >
                <Select.Option value="available">Available</Select.Option>
                <Select.Option value="adopted">Adopted</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Price">
              <Input
                type="number"
                value={editingPet?.price || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, price: Number(e.target.value) }))
                }
              />
            </Form.Item>
            <Form.Item label="Age (Months)">
              <Input
                type="number"
                value={editingPet?.age_months || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, age_months: Number(e.target.value) }))
                }
              />
              <p className="text-[10px] text-gray-500 mt-1">Current: {formatAge(editingPet?.age_months || 0)}</p>
            </Form.Item>
            <Form.Item label="Contact Number">
              <Input
                placeholder="+923..."
                value={editingPet?.contact_number || undefined}
                onChange={(e) =>
                  setEditingPet((prev) => ({ ...prev!, contact_number: e.target.value }))
                }
              />
            </Form.Item>
            {/* Listing Type Switch */}
            <div className="flex justify-between mb-4">
              <button
                className={`w-1/2 py-2 px-4 text-center rounded-lg ${editingPet?.listing_type === "adoption"
                  ? "bg-primary text-white"
                  : "bg-gray-100"
                  }`}
                onClick={() =>
                  setEditingPet({ ...editingPet!, listing_type: "adoption" })
                }
              >
                Adoption
              </button>
              <button
                className={`w-1/2 py-2 px-4 text-center rounded-lg ${editingPet?.listing_type === "foster"
                  ? "bg-primary text-white"
                  : "bg-gray-100"
                  }`}
                onClick={() =>
                  setEditingPet({ ...editingPet!, listing_type: "foster" })
                }
              >
                Foster
              </button>
            </div>

          </Form>
        </Modal>
      </div>
    </>
  );
};

export default AdminPetInteraction;
