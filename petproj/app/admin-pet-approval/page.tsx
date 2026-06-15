'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Table, Button, Space, message, Select, Input, Modal, Image, Spin } from 'antd';
import NextImage from 'next/image';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { fetchAdoptionPets } from '../store/slices/adoptionPetsSlice';
import { UseDispatch, useDispatch } from 'react-redux';
import { fetchFosterPets } from '../store/slices/fosterPetsSlice';
import { AppDispatch } from '../store/store';
import { formatAge } from '@/utils/formatAge';
import { getOptimizedImageUrl, BLUR_DATA_URL } from '@/utils/imageOptimizer';

const { Option } = Select;

const PET_TYPE_LABELS: Record<number, string> = {
  1: 'Dog',
  2: 'Cat',
  3: 'Bird',
  4: 'Fish',
  5: 'Rabbit',
  6: 'Hamster',
  7: 'Guinea Pig',
  8: 'Turtle',
  11: 'Horse',
  15: 'Mouse',
};

type Pet = {
  pet_id: number;
  owner_id: number;
  pet_name: string | null;
  pet_type: number | null;
  pet_breed: string | null;
  city_id: number | null;
  city: string;
  area: string;
  age_months: number | null;
  description: string | null;
  sex: string;
  vaccinated: boolean;
  approved: boolean;
};

type City = {
  city_id: number;
  city_name: string;
};

type PetImage = {
  image_id: number;
  image_url: string;
  order: number;
};

type PetTag = {
  tag_id: number;
  tag_name: string;
  tag_category: string;
};

type PetDetail = Pet & {
  images?: PetImage[];
  tags?: PetTag[];
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  owner_image?: string;
  price?: string | number | null;
  contact_number?: string | null;
  listing_type?: string;
  neutered?: boolean;
};

const AdminPetApproval: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal detail states
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [petDetail, setPetDetail] = useState<PetDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Prefetch cache: maps petId → in-flight or resolved fetch Promise
  const prefetchCache = useRef<Map<number, Promise<PetDetail>>>(new Map());

  const fetchPetDetail = (petId: number): Promise<PetDetail> => {
    if (prefetchCache.current.has(petId)) {
      return prefetchCache.current.get(petId)!;
    }
    const promise = fetch(`/api/v1/pets/${petId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load');
        return res.json() as Promise<PetDetail>;
      })
      .catch((err) => {
        // Remove from cache on error so a retry is possible
        prefetchCache.current.delete(petId);
        throw err;
      });
    prefetchCache.current.set(petId, promise);
    return promise;
  };

  useEffect(() => {
    // Fetch both listings and cities in parallel for better performance
    const fetchData = async () => {
      setLoading(true);
      try {
        const [listingsRes, citiesRes] = await Promise.all([
          fetch('/api/v1/admin/listings'),
          fetch('/api/v1/cities')
        ]);

        const [listingsData, citiesData] = await Promise.all([
          listingsRes.json(),
          citiesRes.json()
        ]);

        if (listingsRes.ok) {
          setPets(listingsData);
          setFilteredPets(listingsData);
        } else {
          console.error('Failed to fetch listings');
        }

        if (citiesRes.ok) {
          setCities(citiesData);
        } else {
          console.error('Failed to fetch cities');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...pets];

    // Filter by type
    if (typeFilter !== "all") {
      if (typeFilter === "other") {
        result = result.filter((pet) => pet.pet_type !== 1 && pet.pet_type !== 2 && pet.pet_type !== 3);
      } else {
        result = result.filter((pet) => pet.pet_type === Number(typeFilter));
      }
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
  }, [pets, sortBy, typeFilter, searchTerm]);

  const dispatch = useDispatch<AppDispatch>();

  const handleView = async (petId: number) => {
    setSelectedPetId(petId);
    setModalOpen(true);
    setDetailLoading(true);
    setPetDetail(null);
    try {
      // Use the prefetch cache — if hover already started the request, this
      // resolves immediately instead of firing a brand-new network call.
      const data = await fetchPetDetail(petId);
      setPetDetail(data);
    } catch (error) {
      console.error('Error fetching pet details:', error);
      message.error('Failed to load pet details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Approve pet
  const handleApprove = async (petId: number) => {
    dispatch(fetchAdoptionPets({}));
    dispatch(fetchFosterPets());
    setLoading(true);
    try {
      const response = await fetch('/api/v1/admin/listings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pet_id: petId, approved: true }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Failed to approve pet';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to approve pet');
      }

      message.success('Pet listing approved successfully');

      // Remove the approved pet from the list
      setPets((prevPets) => prevPets.filter((pet) => pet.pet_id !== petId));
    } catch (error) {
      console.error('Approval error:', error);
      message.error(error instanceof Error ? error.message : 'Failed to approve pet listing');
    } finally {
      setLoading(false);
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
      render: (type: number | null) => type !== null ? (PET_TYPE_LABELS[type] || 'Other') : 'N/A',
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
      render: (ageMonths: number | null) => formatAge(ageMonths),
    },
    {
      title: 'Sex',
      dataIndex: 'sex',
      key: 'sex',
      responsive: ['sm'] as any,
      render: (sex: string | null) => sex ? <span className="capitalize">{sex}</span> : 'N/A',
    },
    {
      title: 'City',
      dataIndex: 'city',
      key: 'city',
      responsive: ['lg'] as any,
      render: (city: string | null) => city || 'Unknown',
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
            size="small"
            // Start fetching pet detail on hover so data is ready before click
            onMouseEnter={() => fetchPetDetail(record.pet_id)}
            onClick={() => handleView(record.pet_id)}
          >
            View
          </Button>
          {!record.approved ? (
            <Button
              className="bg-primary text-white rounded-lg"
              size="small"
              onClick={() => handleApprove(record.pet_id)}
            >
              Approve
            </Button>
          ) : (
            <span className="text-green-600 font-medium">Approved</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="bg-gray-100 min-h-screen px-4 md:px-10 py-8">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold mb-6">Pet Listing Approvals</h1>

          {/* Filters and Search */}
          <div className="bg-white p-4 rounded-lg shadow mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              {/* Type Filter */}
              <div>
                <label className="block text-sm font-medium mb-2">Pet Type</label>
                <Select
                  value={typeFilter}
                  onChange={setTypeFilter}
                  className="w-full"
                >
                  <Option value="all">All Types</Option>
                  <Option value="1">Dog</Option>
                  <Option value="2">Cat</Option>
                  <Option value="3">Bird</Option>
                  <Option value="other">Other</Option>
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
                  <Option value="newest">Newest First</Option>
                  <Option value="oldest">Oldest First</Option>
                  <Option value="name">Name (A-Z)</Option>
                </Select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing {filteredPets.filter((pet) => !pet.approved).length} pending approvals
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <Table
              columns={columns}
              dataSource={filteredPets.filter((pet) => !pet.approved)}
              rowKey="pet_id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} pending approvals`,
                responsive: true,
              }}
              scroll={{ x: 768 }}
            />
          </div>
        </div>
      </div>

      {/* Review Detail Modal */}
      <Modal
        title={petDetail ? `Review Listing: ${petDetail.pet_name || 'Unnamed'}` : "Review Listing"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setModalOpen(false)}>
            Close
          </Button>,
          petDetail && !petDetail.approved && (
            <Button
              key="approve"
              type="primary"
              className="bg-primary text-white"
              onClick={async () => {
                await handleApprove(petDetail.pet_id);
                setModalOpen(false);
              }}
            >
              Approve
            </Button>
          )
        ]}
      >
        {detailLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spin size="large" />
          </div>
        ) : petDetail ? (
          <div className="space-y-6">
            {/* Photos Section */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Photos</h3>
              {petDetail.images && petDetail.images.length > 0 ? (
                // Image.PreviewGroup is kept for the Ant Design lightbox/zoom on click.
                // The actual thumbnail rendered is next/image for WebP conversion,
                // correct sizing, and blur-up placeholder.
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {petDetail.images.map((img, idx) => (
                    <div
                      key={img.image_id}
                      className="relative aspect-square w-full h-32 overflow-hidden rounded-lg border cursor-pointer"
                    >
                      <NextImage
                        src={getOptimizedImageUrl(img.image_url, 400)}
                        alt="Pet photo"
                        fill
                        sizes="(max-width: 640px) 50vw, 200px"
                        className="object-cover"
                        // First image loads eagerly; rest are lazy
                        priority={idx === 0}
                        loading={idx === 0 ? 'eager' : 'lazy'}
                        placeholder="blur"
                        blurDataURL={BLUR_DATA_URL}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 border border-dashed rounded-lg p-6 text-center text-gray-500">
                  No images uploaded
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Pet Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium text-gray-500">Name:</div>
                  <div>{petDetail.pet_name || 'N/A'}</div>

                  <div className="font-medium text-gray-500">Type:</div>
                  <div>{petDetail.pet_type !== null ? (PET_TYPE_LABELS[petDetail.pet_type] || 'Other') : 'N/A'}</div>

                  <div className="font-medium text-gray-500">Breed:</div>
                  <div>{petDetail.pet_breed || 'N/A'}</div>

                  <div className="font-medium text-gray-500">Sex:</div>
                  <div className="capitalize">{petDetail.sex || 'N/A'}</div>

                  <div className="font-medium text-gray-500">Age:</div>
                  <div>{formatAge(petDetail.age_months)}</div>

                  <div className="font-medium text-gray-500">Listing Type:</div>
                  <div className="capitalize">{petDetail.listing_type || 'N/A'}</div>

                  {petDetail.listing_type === 'foster' && (
                    <>
                      <div className="font-medium text-gray-500">Price/Fee:</div>
                      <div>{petDetail.price ? `Rs. ${petDetail.price}` : 'Free'}</div>
                    </>
                  )}

                  <div className="font-medium text-gray-500">Location:</div>
                  <div>{petDetail.city ? `${petDetail.area}, ${petDetail.city}` : petDetail.area || 'N/A'}</div>
                </div>

                <div className="pt-2 text-sm">
                  <div className="font-medium text-gray-500 mb-1">Status attributes:</div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${petDetail.vaccinated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {petDetail.vaccinated ? 'Vaccinated' : 'Not Vaccinated'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${petDetail.neutered ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {petDetail.neutered ? 'Neutered' : 'Not Neutered'}
                    </span>
                  </div>
                </div>

                {petDetail.tags && petDetail.tags.length > 0 && (
                  <div className="pt-2 text-sm">
                    <div className="font-medium text-gray-500 mb-1">Tags:</div>
                    <div className="flex flex-wrap gap-1.5">
                      {petDetail.tags.map((tag) => (
                        <span key={tag.tag_id} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs border border-blue-100">
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Owner & Contact Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="font-medium text-gray-500">Owner Name:</div>
                  <div>{petDetail.owner_name || 'N/A'}</div>

                  <div className="font-medium text-gray-500">Owner Email:</div>
                  <div className="break-all">{petDetail.owner_email || 'N/A'}</div>

                  <div className="font-medium text-gray-500">Contact Phone:</div>
                  <div>{petDetail.contact_number || petDetail.owner_phone || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-gray-50 rounded-lg p-4 text-sm border">
              <h4 className="font-semibold text-gray-700 mb-2">Description</h4>
              <p className="whitespace-pre-line text-gray-600 leading-relaxed">
                {petDetail.description || 'No description provided.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            Failed to load pet details.
          </div>
        )}
      </Modal>
    </>
  );
};

export default AdminPetApproval;


