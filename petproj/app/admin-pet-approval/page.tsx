'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Select, Input } from 'antd';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { fetchAdoptionPets } from '../store/slices/adoptionPetsSlice';
import { UseDispatch, useDispatch } from 'react-redux';
import { fetchFosterPets } from '../store/slices/fosterPetsSlice';
import { AppDispatch } from '../store/store';

const { Option } = Select;


type Pet = {
  pet_id: number;
  owner_id: number;
  pet_name: string | null;
  pet_type: string | null;
  pet_breed: string | null;
  city_id: number | null;
  city: string; // Assuming this comes from the API
  area: string;
  age: number | null;
  description: string | null;
  sex: string;
  vaccinated: boolean;
  approved: boolean;
};

type City = {
  city_id: number;
  city_name: string;
};

const AdminPetApproval: React.FC = () => {


  const [pets, setPets] = useState<Pet[]>([]);
  const [filteredPets, setFilteredPets] = useState<Pet[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortBy, setSortBy] = useState<string>("newest");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/listing-approvals');
        if (!response.ok) {
          throw new Error('Failed to fetch pets');
        }
        const data: Pet[] = await response.json();
        setPets(data);
        setFilteredPets(data);
      } catch (error) {
        console.error('Error fetching pets:', error);
      }
    };

    const fetchCities = async () => {
      try {
        const response = await fetch('/api/cities');
        if (!response.ok) {
          throw new Error('Failed to fetch cities');
        }
        const data: City[] = await response.json();
        setCities(data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };

    fetchCities();
    fetchPets();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...pets];

    // Filter by type
    if (typeFilter !== "all") {
      result = result.filter((pet) => pet.pet_type === typeFilter);
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

  // Approve pet
  const handleApprove = async (petId: number) => {
    dispatch(fetchAdoptionPets());
    dispatch(fetchFosterPets());
    setLoading(true);
    try {
      const response = await fetch('/api/listing-approvals', {
        method: 'PUT',
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
    },
    {
      title: 'Breed',
      dataIndex: 'pet_breed',
      key: 'pet_breed',
      responsive: ['lg'] as any,
    },
    {
      title: 'Age',
      dataIndex: 'age',
      key: 'age',
      responsive: ['md'] as any,
      render: (age: number | null) => (age !== null ? age : 'N/A'),
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
        const cityName = cities.find((city) => city.city_id === cityId)?.city_name || 'Unknown';
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
                  <Option value="Dog">Dog</Option>
                  <Option value="Cat">Cat</Option>
                  <Option value="Bird">Bird</Option>
                  <Option value="Other">Other</Option>
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
    </>
  );
};

export default AdminPetApproval;
