'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../store/store';
import { fetchCities } from '../store/slices/citiesSlice';

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

const AdminPetApproval: React.FC = () => {

  useSetPrimaryColor();

  const dispatch = useDispatch<AppDispatch>();

  const { cities } = useSelector((state: RootState) => state.cities); // Get cities from the store
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  useSetPrimaryColor();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/listing-approvals');
        if (!response.ok) {
          throw new Error('Failed to fetch pets');
        }
        const data: Pet[] = await response.json();
        setPets(data);
      } catch (error) {
        console.error(error);
      }
    };


    dispatch(fetchCities());
    fetchPets();
  }, []);

  // Approve pet
  const handleApprove = async (petId: number) => {
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
        const errorData = await response.json();
        message.error(`Approval failed: ${errorData.message || 'Unknown error'}`);
      } else {
        message.success('Pet approved successfully.');
        setPets((prevPets) =>
          prevPets.map((pet) =>
            pet.pet_id === petId ? { ...pet, approved: true } : pet
          )
        );
      }
    } catch (error) {
      message.error('Error approving pet.');
    } finally {
      setLoading(false);
    }
  };
  

  const columns = [
    {
      title: 'Pet ID',
      dataIndex: 'pet_id',
      key: 'pet_id',
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
    },
    {
      title: 'Breed',
      dataIndex: 'pet_breed',
      key: 'pet_breed',
    },
    {
      title: 'Age (years)',
      dataIndex: 'age',
      key: 'age',
      render: (age: number | null) => (age !== null ? age : 'Unknown'),
    },
    {
      title: 'Sex',
      dataIndex: 'sex',
      key: 'sex',
    },
    {
      title: 'City',
      dataIndex: 'city_id',
      key: 'city_id',
      render: (cityId: number) => {
        const cityName = cities.find(city => city.city_id === cityId)?.city_name || 'Unknown';
        return cityName;
      },
    },
    
    {
      title: 'Vaccinated',
      dataIndex: 'vaccinated',
      key: 'vaccinated',
      render: (vaccinated: boolean) => (vaccinated ? 'Yes' : 'No'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Pet) => (
        <Space>
          {!record.approved ? (
            <Button
              className="bg-primary text-white rounded-2xl"
              onClick={() => handleApprove(record.pet_id)}
            >
              Approve
            </Button>
          ) : (
            <span className="bg-primary">Approved</span>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Navbar />
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">Admin Pet Approval</h1>
        <Table
          columns={columns}
          dataSource={pets.filter((pet) => !pet.approved)} // Only show pets that need approval
          rowKey="pet_id"
          loading={loading}
          className="bg-white shadow"
        />
      </div>
    </>
  );
};

export default AdminPetApproval;
