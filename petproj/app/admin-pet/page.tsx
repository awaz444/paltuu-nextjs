'use client';

import React, { useEffect, useState } from 'react';
import { Table, Button, Space, message, Popconfirm, Form, Select, Modal, Input } from 'antd';
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

const AdminPetInteraction: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  useSetPrimaryColor();
  const [showConfirm, setShowConfirm] = useState<{ pet_id: number | null; show: boolean }>({
    pet_id: null,
    show: false,
  });

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

  // Delete pet
  const handleDelete = async (petId: number) => {
    setLoading(true);
    try {
      const response = await fetch('/api/pets', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pet_id: petId }),
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

  const handleUpdate = async () => {
    if (!editingPet) return;
  
    setLoading(true);
    try {
      const response = await fetch('/api/pets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingPet),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        message.error(`Update failed: ${errorData.message || 'Unknown error'}`);
      } else {
        message.success('Pet updated successfully.');
        setPets((prevPets) =>
          prevPets.map((pet) =>
            pet.pet_id === editingPet.pet_id ? { ...pet, ...editingPet } : pet
          )
        );
      }
    } catch (error) {
      message.error('Error updating pet.');
    } finally {
      setLoading(false);
      setEditingPet(null); // Close the edit modal or drawer
    }
  };
  
  const handleCancel = () => {
    setEditingPet(null); // Close the edit modal or drawer
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
          {!record.approved && (
            <>
              <Button
                className="bg-green-500 text-white"
                onClick={() => message.success(`Pet ${record.pet_id} approved.`)}
              >
                Approve
              </Button>
            </>
          )}
          <Button
            className="bg-blue-500 text-white"
            onClick={() => message.info(`Edit pet ${record.pet_id}.`)}
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
            <Button className="bg-red-500 text-white">Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
    <Navbar/>
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Admin Pet Interaction</h1>
      <Table
        columns={columns}
        dataSource={pets}
        rowKey="pet_id"
        loading={loading}
        className="bg-white shadow"
      />
      <Modal
  title="Edit Pet Listing"
  visible={!!editingPet}
  onCancel={handleCancel}
  onOk={handleUpdate}
  okText="Update"
  cancelText="Cancel"
>
  <Form layout="vertical" initialValues={editingPet || undefined}>
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
    {/* Other form fields */}
  </Form>
</Modal>

    </div>
    </>
  );
};

export default AdminPetInteraction;
