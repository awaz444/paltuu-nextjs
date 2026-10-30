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
import PhoneNumberInput from '@/components/PhoneNumberInput';

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
  social_card_url?: string | null;
  images?: { image_id?: number; image_url: string; order?: number }[];
};

const PET_TYPE_LABELS: Record<number, string> = { 1: 'Dog', 2: 'Cat', 3: 'Bird' };
const MOBILE_PAGE_SIZE = 20;

const StatusBadge = ({ status }: { status: string }) => {
  const tone =
    status === 'available' ? 'bg-green-100 text-green-800'
      : status === 'adopted' ? 'bg-gray-200 text-gray-700'
        : 'bg-amber-100 text-amber-800';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${tone}`}>
      {status || 'unknown'}
    </span>
  );
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
  const [generatingCard, setGeneratingCard] = useState(false);
  // Which saved photo the social card is built from (defaults to the first).
  const [cardImageUrl, setCardImageUrl] = useState<string | null>(null);
  const [mobileVisible, setMobileVisible] = useState(MOBILE_PAGE_SIZE);

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

  // Reset the card photo choice whenever a different pet is opened.
  useEffect(() => {
    setCardImageUrl(editingPet?.images?.[0]?.image_url ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingPet?.pet_id]);

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
    setMobileVisible(MOBILE_PAGE_SIZE);
  }, [pets, sortBy, statusFilter, typeFilter, searchTerm]);

  const cityName = (cityId: number | null) =>
    cities.find((city) => city.city_id === cityId)?.city_name || 'Unknown';

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

  const handleGenerateSocialCard = async () => {
    if (!editingPet) return;
    setGeneratingCard(true);
    try {
      const res = await fetch('/api/v1/admin/generate-social-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pet_id: editingPet.pet_id, image_url: cardImageUrl ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error || 'Failed to generate social card');
        return;
      }
      setEditingPet((prev) => prev ? { ...prev, social_card_url: data.social_card_url } : prev);
      setPets((prev) => prev.map((p) =>
        p.pet_id === editingPet.pet_id ? { ...p, social_card_url: data.social_card_url } : p
      ));
      message.success('Social card generated!');
    } catch {
      message.error('Error generating social card');
    } finally {
      setGeneratingCard(false);
    }
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

      <div className="bg-gray-100 min-h-screen px-3 py-4 sm:px-4 md:px-10 md:py-8">
        <div className="container mx-auto">
          <h1 className="mb-4 text-xl font-bold md:mb-6 md:text-2xl">Admin Pet Management</h1>

          {/* Filters and Search */}
          <div className="mb-4 rounded-lg bg-white p-3 shadow md:mb-6 md:p-4">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
              {/* Search */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 hidden text-sm font-medium md:block">Search Pets</label>
                <Input
                  placeholder="Search by name or breed"
                  allowClear
                  size="large"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>

              {/* Status Filter */}
              <div>
                <label className="mb-2 hidden text-sm font-medium md:block">Adoption Status</label>
                <Select value={statusFilter} onChange={setStatusFilter} size="large" className="w-full">
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="available">Available</Select.Option>
                  <Select.Option value="adopted">Adopted</Select.Option>
                  <Select.Option value="pending">Pending</Select.Option>
                </Select>
              </div>

              {/* Type Filter */}
              <div>
                <label className="mb-2 hidden text-sm font-medium md:block">Listing Type</label>
                <Select value={typeFilter} onChange={setTypeFilter} size="large" className="w-full">
                  <Select.Option value="all">All Types</Select.Option>
                  <Select.Option value="adoption">Adoption</Select.Option>
                  <Select.Option value="foster">Foster</Select.Option>
                </Select>
              </div>

              {/* Sort */}
              <div className="col-span-2 md:col-span-1">
                <label className="mb-2 hidden text-sm font-medium md:block">Sort By</label>
                <Select value={sortBy} onChange={setSortBy} size="large" className="w-full">
                  <Select.Option value="newest">Newest First</Select.Option>
                  <Select.Option value="oldest">Oldest First</Select.Option>
                  <Select.Option value="name">Name (A-Z)</Select.Option>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-3 text-sm text-gray-600 md:mt-4">
              Showing {filteredPets.length} of {pets.length} pets
            </div>
          </div>

          {/* Mobile: card list */}
          <div className="space-y-3 md:hidden">
            {loading && pets.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">Loading pets…</div>
            ) : filteredPets.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">No pets match these filters</div>
            ) : (
              <>
                {filteredPets.slice(0, mobileVisible).map((pet) => {
                  const thumb = pet.images?.[0]?.image_url;
                  const facts = [
                    pet.pet_type !== null ? (PET_TYPE_LABELS[pet.pet_type] || 'Other') : null,
                    pet.pet_breed?.trim() || null,
                    pet.age_months !== null ? formatAge(pet.age_months) : null,
                    pet.sex || null,
                  ].filter(Boolean);
                  return (
                    <div key={pet.pet_id} className="rounded-xl bg-white p-3 shadow-sm">
                      <div className="flex gap-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={thumb}
                            alt=""
                            loading="lazy"
                            className="h-20 w-20 shrink-0 rounded-lg bg-gray-100 object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No image
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 break-words text-base font-semibold leading-snug text-gray-900">
                              {pet.pet_name || 'N/A'}
                            </div>
                            <StatusBadge status={pet.adoption_status} />
                          </div>
                          <div className="mt-0.5 text-xs text-gray-400">
                            #{pet.pet_id} · <span className="capitalize">{pet.listing_type}</span>
                            {pet.social_card_url ? ' · Card ready' : ''}
                          </div>
                          <div className="mt-1 text-sm capitalize text-gray-600">{facts.join(' · ')}</div>
                          <div className="text-sm text-gray-500">
                            {cityName(pet.city_id)} · {pet.vaccinated ? 'Vaccinated' : 'Not vaccinated'}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingPet(pet)}
                          className="min-h-[44px] rounded-lg bg-primary text-sm font-semibold text-white active:opacity-90"
                        >
                          Edit
                        </button>
                        <Popconfirm
                          title="Delete this pet?"
                          onConfirm={() => confirmDelete(pet.pet_id)}
                          onCancel={cancelDelete}
                          okText="Delete"
                          okButtonProps={{ danger: true }}
                          cancelText="No"
                        >
                          <button
                            type="button"
                            className="min-h-[44px] w-full rounded-lg border border-red-200 bg-white text-sm font-semibold text-red-600 active:bg-red-50"
                          >
                            Delete
                          </button>
                        </Popconfirm>
                      </div>
                    </div>
                  );
                })}
                {filteredPets.length > mobileVisible && (
                  <button
                    type="button"
                    onClick={() => setMobileVisible((n) => n + MOBILE_PAGE_SIZE)}
                    className="min-h-[44px] w-full rounded-lg bg-white text-sm font-semibold text-gray-700 shadow"
                  >
                    Show more ({filteredPets.length - mobileVisible} left)
                  </button>
                )}
              </>
            )}
          </div>

          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-lg bg-white shadow md:block">
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
          title={editingPet ? `Edit: ${editingPet.pet_name || 'Pet'} (#${editingPet.pet_id})` : 'Edit Pet Listing'}
          open={!!editingPet}
          onCancel={handleCancel}
          width={640}
          style={{ top: 12, maxWidth: 'calc(100vw - 16px)' }}
          footer={
            <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
              <Button size="large" className="w-full sm:w-auto" onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                size="large"
                type="primary"
                className="w-full bg-primary text-white sm:w-auto"
                loading={loading}
                onClick={handleUpdate}
              >
                Update
              </Button>
            </div>
          }
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
              <PhoneNumberInput
                value={editingPet?.contact_number || ""}
                onChange={(v) =>
                  setEditingPet((prev) => ({ ...prev!, contact_number: v }))
                }
                className="border border-[#d9d9d9] rounded-lg px-3 py-2"
              />
            </Form.Item>
            {/* Listing Type Switch */}
            <div className="flex justify-between mb-4">
              <button
                type="button"
                className={`w-1/2 min-h-[44px] py-2 px-4 text-center rounded-lg ${editingPet?.listing_type === "adoption"
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
                type="button"
                className={`w-1/2 min-h-[44px] py-2 px-4 text-center rounded-lg ${editingPet?.listing_type === "foster"
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

            {/* Social Card */}
            <div className="mt-2 mb-2 rounded-lg border bg-gray-50 p-3 sm:p-4">
              <p className="mb-1 text-sm font-semibold text-gray-700">Social Card</p>
              {editingPet?.images && editingPet.images.length > 0 ? (
                <>
                  <p className="mb-2 text-xs text-gray-500">Pick the photo to build the card from</p>
                  <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {editingPet.images.map((img, i) => {
                      const selected = cardImageUrl === img.image_url;
                      return (
                        <button
                          key={img.image_id ?? img.image_url}
                          type="button"
                          onClick={() => setCardImageUrl(img.image_url)}
                          aria-pressed={selected}
                          aria-label={`Use photo ${i + 1}`}
                          className={`relative aspect-square overflow-hidden rounded-lg border-2 ${
                            selected ? 'border-primary' : 'border-transparent opacity-70'
                          }`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img.image_url} alt="" className="h-full w-full object-cover" />
                          {selected && (
                            <span className="absolute right-1 top-1 rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                              ✓
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {fileList.some((f) => f.originFileObj) && (
                    <p className="mb-2 text-xs text-amber-700">New uploads can be used for the card after you press Update.</p>
                  )}
                </>
              ) : (
                <p className="mb-2 text-xs text-gray-500">Add a photo and press Update to make a card.</p>
              )}

              <div className="flex flex-col items-center gap-3">
                {editingPet?.social_card_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={editingPet.social_card_url}
                    alt="Social card preview"
                    className="w-48 rounded-lg shadow"
                    style={{ aspectRatio: '4/5', objectFit: 'cover' }}
                  />
                ) : (
                  <p className="text-xs text-gray-500">No card generated yet</p>
                )}
                <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
                  {editingPet?.social_card_url && (
                    <a
                      href={editingPet.social_card_url}
                      download={`listing_${editingPet.pet_id}_social.jpg`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex min-h-[40px] items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:text-white"
                    >
                      Download
                    </a>
                  )}
                  <Button
                    size="large"
                    className={editingPet?.social_card_url ? '' : 'col-span-2'}
                    loading={generatingCard}
                    disabled={!cardImageUrl}
                    onClick={handleGenerateSocialCard}
                  >
                    {editingPet?.social_card_url ? 'Regenerate' : 'Generate Card'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Caption Generator */}
            {editingPet && (() => {
              const cityName = cities.find(c => c.city_id === editingPet.city_id)?.city_name ?? '';
              const location = [editingPet.area, cityName].filter(Boolean).join(', ');
              const caption = [
                'ADOPT NOW ON PALTUU.PK!!',
                '',
                editingPet.description ?? '',
                '',
                'Details:',
                '',
                editingPet.pet_breed ? `Breed: ${editingPet.pet_breed}` : '',
                editingPet.age_months != null ? `Age: ${formatAge(editingPet.age_months)}` : '',
                editingPet.sex ? `Sex: ${editingPet.sex.charAt(0).toUpperCase() + editingPet.sex.slice(1)}` : '',
                location ? `Location: ${location}` : '',
              ].filter((line, i, arr) => {
                // collapse consecutive blank lines
                if (line !== '') return true;
                return arr[i - 1] !== '';
              }).join('\n');

              return (
                <div className="mt-4 mb-2 border rounded-lg p-4 bg-gray-50">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Post Caption</p>
                  <textarea
                    readOnly
                    value={caption}
                    rows={10}
                    className="w-full text-xs font-mono bg-white border border-gray-200 rounded p-2 resize-none text-gray-800"
                  />
                  <Button
                    size="small"
                    className="mt-2"
                    onClick={() => {
                      navigator.clipboard.writeText(caption);
                      message.success('Caption copied!');
                    }}
                  >
                    Copy Caption
                  </Button>
                </div>
              );
            })()}

          </Form>
        </Modal>
      </div>
    </>
  );
};

export default AdminPetInteraction;
