import React, { useState } from "react";
import { Modal } from "antd";
import Link from "next/link";
import { EnvironmentOutlined, UserOutlined } from "@ant-design/icons";

export interface QurbaniAnimal {
  id: string;
  species: "Goat" | "Cow" | "Bull" | "Sheep" | "Camel";
  breed: string;
  age: number;
  weight: number;
  description?: string;
  price: number;
  status: "Available" | "Sold" | "Reserved";
  location: string;
  city: string;
  sellerName: string;
  sellerContact: string;
  sellerProfileImage?: string;
  images: string[];
}

interface EidBazaarGridProps {
  animals: QurbaniAnimal[];
}

const EidBazaarGrid: React.FC<EidBazaarGridProps> = ({ animals }) => {
  const [selectedAnimal, setSelectedAnimal] = useState<QurbaniAnimal | null>(null);

  if (animals.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No animals found matching your criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create Listing Button - Matches Lost & Found style */}
        <Link
          href="/eid-bazaar/create-listing"
          className="create-listing-btn hidden sm:flex bg-white text-primary p-4 rounded-3xl shadow-sm overflow-hidden flex-col items-center justify-center border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 text-sm sm:text-base"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            fill="currentColor"
            className="bi bi-plus-circle mb-3"
            viewBox="0 0 16 16"
          >
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
          </svg>
          Sell Animal
        </Link>

        {/* Mobile create button */}
        <Link
          href="/eid-bazaar/create-listing"
          className="fixed bottom-4 right-2 sm:hidden z-50"
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
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
            <span className="text-xs">Add</span>
          </button>
        </Link>

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
              <span className={`absolute top-3 right-3 px-2 py-1 rounded-full text-xs font-medium ${
                animal.status === "Available" ? "bg-green-100 text-green-800" :
                animal.status === "Reserved" ? "bg-yellow-100 text-yellow-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {animal.status}
              </span>
            </div>
            <div className="p-4">
              <h3 className="font-bold text-xl mb-1">
                {animal.breed}
              </h3>
              <p className="text-primary font-semibold mb-1">{animal.price.toLocaleString()} PKR</p>
              <div className="flex flex-row gap-2 mb-1">
                <p className="text-gray-400 text-sm sm:text-base">{animal.species} • {animal.age} yrs • {animal.weight}</p>
              </div>
              <div className="flex flex-row gap-2 items-center mb-2">
                <EnvironmentOutlined className="text-primary" />
                <p className="text-gray-600">{animal.city}, {animal.location}</p>
              </div>
              <div className="flex flex-row gap-2 items-center">
                {animal.sellerProfileImage ? (
                  <img
                    src={animal.sellerProfileImage}
                    alt={animal.sellerName}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserOutlined className="text-primary" />
                )}
                <p className="text-gray-600 truncate max-w-[120px] sm:max-w-[140px]">
                  {animal.sellerName}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Animal Details Modal - Consistent with Lost & Found */}
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
            {/* Seller Header */}
            <div className="flex items-center gap-3 mb-6">
              {selectedAnimal.sellerProfileImage ? (
                <img
                  src={selectedAnimal.sellerProfileImage}
                  alt={selectedAnimal.sellerName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <UserOutlined className="text-xl text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{selectedAnimal.sellerName}</h3>
                <p className="text-sm text-gray-500">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

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
                <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm font-medium inline-block">
                  {selectedAnimal.price.toLocaleString()} PKR
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
                      <p className="text-gray-800">{selectedAnimal.weight}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Breed</label>
                      <p className="text-gray-800">{selectedAnimal.breed}</p>
                    </div>
                  </div>

                  {/* Description Section */}
                  {selectedAnimal.description && (
                    <div className="pt-2">
                      <label className="text-sm font-medium text-gray-500">Description</label>
                      <p className="text-gray-700 mt-1 whitespace-pre-line">
                        {selectedAnimal.description}
                      </p>
                    </div>
                  )}

                  {/* Contact Section */}
                  <div className="pt-4 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-500">Contact Information</label>
                    <div className="flex items-center gap-2 mt-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-primary"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M2.005 5.995V18c0 1.103.897 2 2 2h16c1.103 0 2-.897 2-2V6c0-1.103-.897-2-2-2h-16c-1.103 0-2 .897-2 1.995zM4 6h16v12H4V6z"></path>
                        <path d="M16 3H8v2h8V3z"></path>
                        <path d="M12 15.5 18 9h-6z"></path>
                      </svg>
                      <a
                        href={`tel:${selectedAnimal.sellerContact}`}
                        className="text-primary hover:text-primary-dark transition-colors"
                      >
                        {selectedAnimal.sellerContact}
                      </a>
                    </div>
                    <button className="mt-4 w-full bg-green-500 text-white py-2 rounded-lg flex items-center justify-center gap-2">
                      Contact via WhatsApp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default EidBazaarGrid;