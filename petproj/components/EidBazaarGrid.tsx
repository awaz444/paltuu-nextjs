import React, { useEffect, useState } from "react";
import { Modal } from "antd";
import Link from "next/link";
import EidBazaarListing from "./EidBazarListing";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";
import axios from "axios";
import { message } from "antd";

export interface QurbaniAnimal {
  id: string;
  species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
  breed: string;
  age: number;
  weight: number;
  height: number;
  teeth_count?: number;
  horn_condition?: 'Good' | 'Damaged' | 'Broken' | 'None';
  isVaccinated: boolean;
  description?: string;
  price: number | null;
  status: "Available" | "Sold" | "Reserved";
  location: string;
  city: string;
  sellerId: string;
  images: string[];
}

interface EidBazaarGridProps {
  animals: QurbaniAnimal[];
}

const EidBazaarGrid: React.FC<EidBazaarGridProps> = ({ animals }) => {
  const [selectedAnimal, setSelectedAnimal] = useState<QurbaniAnimal | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);


  // Get user ID from localStorage when component mounts
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setUserId(user.id); // Set the user ID in state
      } catch (error) {
        console.error('Failed to parse user data:', error);
      }
    }
  }, []);

  const handleCreateSubmit = async (values: any): Promise<{ animalId: string }> => {
    try {
      setLoading(true);

      // Get current user (replace with your actual auth logic)
      if (!userId) {
        throw new Error('User not authenticated');
      } // Example - get from your auth context

      // Prepare the payload matching your API's CreateQurbaniAnimalDto
      const payload = {
        seller_id: userId,
        species: values.species,
        breed: values.breed,
        age: values.age,
        weight: values.weight,
        height: values.height,
        teethCount: values.teeth_count,
        hornCondition: values.horn_condition,
        isVaccinated: values.is_vaccinated,
        description: values.description,
        price: values.callForPrice ? null : values.price,
        location: values.location,
        city: values.city
      };

      const response = await fetch('/api/qurbani-animals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const data = await response.json();
      message.success('Animal listing created successfully!');

      return { animalId: String(data.id) }; // Return the created animal ID
    } // In your handleCreateSubmit catch block:
    catch (error: any) {
      let errorMessage = 'Failed to create listing';
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      message.error(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  if (animals.length === 0) {
    return (
      <>
        <div className="text-center py-12">
          <div className="mb-8">
            <p className="text-gray-500">No animals listed, click below to add your animal to sell.</p>
          </div>

          <div className="flex justify-center">
            <div
              className="create-listing-btn bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base cursor-pointer w-64 text-center"
              onClick={() => setCreateModalVisible(true)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="48"
                height="48"
                fill="currentColor"
                className="bi bi-plus-circle mb-3 mx-auto"
                viewBox="0 0 16 16"
              >
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
                <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
              </svg>
              Sell Animal
            </div>
          </div>
        </div>

        {/* Add the modal here too */}
        <Modal
          title="Create New Listing"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          footer={null}
        >
          <EidBazaarListing
            onSubmit={handleCreateSubmit}
            onCancel={() => setCreateModalVisible(false)}
          />
        </Modal>
      </>
    );
  }

  return (
    <>
      {/* Create Listing Button - Matches Lost & Found style */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-3">
        {/* Modified Create Listing Button to open modal */}
        <div
          className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base cursor-pointer"
          onClick={() => setCreateModalVisible(true)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="currentColor"
            className="bi bi-plus-circle mb-3"
            viewBox="0 0 16 16"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
          </svg>
          Sell Animal
        </div>

        {/* Mobile create button */}
        <div
          className="fixed bottom-4 right-2 sm:hidden z-50"
          onClick={() => setCreateModalVisible(true)}
        >
          <button className="flex items-center gap-1.5 bg-white text-primary border-2 border-primary p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-105">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              className="h-3.5 w-3.5"
              viewBox="0 0 16 16"
            >
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z" />
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z" />
            </svg>
            <span className="text-xs">Add</span>
          </button>
        </div>

        {/* Animal Cards - Consistent with Lost & Found design */}
        {animals.map(animal => (
          <div
            key={animal.id}
            className="bg-white pr-3 pl-3 pt-3 rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:cursor-pointer hover:scale-102 transition-all duration-300"
            onClick={() => setSelectedAnimal(animal)}
          >
            <div className="relative">
              <img
                src={animal.images[0] || "/animal-placeholder.png"}
                alt={animal.breed}
                className="w-full aspect-square object-cover rounded-2xl"
              />
              {/* <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${animal.status === "Available" ? "bg-green-100 text-green-800" :
                animal.status === "Reserved" ? "bg-yellow-100 text-yellow-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                {animal.status}
              </span> */}
            </div>
            <div className="p-4">
              <p className="text-primary font-semibold text-lg mb-1">
                {animal.price !== null ? animal.price.toLocaleString() + ' PKR' : 'Call for Price'}
              </p>
              <h3 className="font-bold text-xl mb-2">
                {animal.breed}
              </h3>

              <div className="flex flex-wrap gap-2 mb-3">
                {animal.isVaccinated && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Vaccinated
                  </span>
                )}
                {animal.teeth_count && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                    {animal.teeth_count} teeth
                  </span>
                )}
              </div>

              <div className="flex flex-row gap-2 items-center mb-2">
                <EnvironmentOutlined className="text-primary" />
                <p className="text-gray-600">{animal.city}, {animal.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Animal Details Modal */}
      {selectedAnimal && (
        <Modal
          title={`${selectedAnimal.breed} ${selectedAnimal.species}`}
          open={!!selectedAnimal}
          onCancel={() => setSelectedAnimal(null)}
          footer={null}
          className="custom-modal"
          width={800}
        >
          <div className="modal-content-wrapper">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Image Section */}
              <div className="relative w-full aspect-square">
                <img
                  src={selectedAnimal.images[0] || "/animal-placeholder.png"}
                  alt={selectedAnimal.breed}
                  className="w-full h-full object-cover rounded-xl shadow-sm"
                />
              </div>

              {/* Details Section */}
              <div className="space-y-4">
                <div className={selectedAnimal.price !== null ?
                  "bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium inline-block" :
                  "bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-medium inline-block"}>
                  {selectedAnimal.price !== null ?
                    selectedAnimal.price.toLocaleString() + ' PKR' :
                    'Call for Price'}
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Location</label>
                    <p className="flex items-center gap-2 text-gray-800">
                      <EnvironmentOutlined className="text-primary" />
                      {selectedAnimal.city} - {selectedAnimal.location}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Species</label>
                      <p className="text-gray-800">{selectedAnimal.species}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Age</label>
                      <p className="text-gray-800">{selectedAnimal.age} years</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Weight</label>
                      <p className="text-gray-800">{selectedAnimal.weight} kg</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Height</label>
                      <p className="text-gray-800">{selectedAnimal.height} cm</p>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="flex gap-4">
                      <span className="font-medium">Vaccination:</span>
                      <span>{selectedAnimal.isVaccinated ? "✅ Certified" : "❌ Not vaccinated"}</span>
                    </div>
                    {selectedAnimal.teeth_count && (
                      <div className="flex gap-4">
                        <span className="font-medium">Teeth Count:</span>
                        <span>{selectedAnimal.teeth_count} (Age verified)</span>
                      </div>
                    )}
                    {selectedAnimal.horn_condition && (
                      <div className="flex gap-4">
                        <span className="font-medium">Horn Condition:</span>
                        <span>{selectedAnimal.horn_condition}</span>
                      </div>
                    )}
                  </div>

                  {selectedAnimal.description && (
                    <div className="pt-2">
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">
                        {selectedAnimal.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Create Listing Modal */}
      <Modal
        title={<span className="text-xl font-bold text-gray-800">Create New Listing</span>}
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={500}
        destroyOnClose
        className="rounded-2xl overflow-hidden"
        styles={{
          header: {
            borderBottom: '1px solid #f3f4f6',
            padding: '16px 24px'
          },
          body: {
            padding: 0
          }
        }}
      >
        <EidBazaarListing
          onSubmit={handleCreateSubmit}
          onCancel={() => setCreateModalVisible(false)}
        />
      </Modal>
    </>
  );
}

export default EidBazaarGrid;