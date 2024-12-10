'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';

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
  useSetPrimaryColor();

  const [pets, setPets] = useState<Pet[]>([]);
  const [cities, setCities] = useState<City[]>([]); // Replacing Redux state with local state
  const [loading, setLoading] = useState(false);

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
        const cityName = cities.find((city) => city.city_id === cityId)?.city_name || 'Unknown';
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
