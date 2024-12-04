'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm } from 'antd';
import Navbar from '@/components/navbar';
import { useSetPrimaryColor } from '../hooks/useSetPrimaryColor';

type Pet = {
  pet_id: number;
  owner_id: number;
  pet_name: string | null;
  pet_type: number | null;
  pet_breed: string | null;
  city_id: number | null;
  area: string;
  age: number | null;
  description: string | null;
  adoption_status: string;
  price: number | null;
  min_age_of_children: number | null;
  can_live_with_dogs: boolean;
  can_live_with_cats: boolean;
  must_have_someone_home: boolean;
  energy_level: number;
  cuddliness_level: number;
  health_issues: string | null;
  sex: string;
  listing_type: string;
  vaccinated: boolean;
  neutered: boolean;
  payment_frequency?: string | null;
  approved: boolean;
};

const AdminPetApproval: React.FC = () => {

  useSetPrimaryColor();

  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  useSetPrimaryColor();

  useEffect(() => {
    const fetchPets = async () => {
      try {
        const response = await fetch('/api/pets');
        if (!response.ok) {
          throw new Error('Failed to fetch pets');
        }
        const data: Pet[] = await response.json();
        setPets(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchPets();
  }, []);

  // Approve pet
  const handleApprove = async (petId: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pets/approve', {
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
        setPets((prevPets) => prevPets.map((pet) =>
          pet.pet_id === petId ? { ...pet, approved: true } : pet
        ));
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
