'use client'

import { useState } from 'react';
import './styles.css'

const LostFoundListingPage = () => {
  const [petName, setPetName] = useState('');
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [age, setAge] = useState<number | string>('');
  const [cityId, setCityId] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [foundDate, setFoundDate] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [activeTab, setActiveTab] = useState<'lost' | 'found'>('lost');

  // Hardcoded cities and categories
  const cities = [
    { id: 'karachi', name: 'Karachi' },
    { id: 'islamabad', name: 'Islamabad' },
    { id: 'lahore', name: 'Lahore' }
  ];

  const petCategories = [
    { id: 1, name: 'Dog' },
    { id: 2, name: 'Cat' },
    { id: 3, name: 'Bird' },
    { id: 4, name: 'Fish' },
    { id: 5, name: 'Rabbit' },
    { id: 6, name: 'Hamster' },
    { id: 7, name: 'Guinea Pig' },
    { id: 8, name: 'Turtle' },
    { id: 11, name: 'Horse' },
    { id: 15, name: 'Mouse' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
  };

  const handleTabToggle = (tab: 'lost' | 'found') => {
    setActiveTab(tab);
  };

  return (
    <div className="fullBody" style={{ maxWidth: '90%', margin: '0 auto' }}>
      {/* Tab Switch Container */}
      <form
        className="bg-white p-6 rounded-3xl shadow-md w-full max-w-lg mx-auto my-8"
        onSubmit={handleSubmit}
      >
        <div className="tab-switch-container mb-6">
          <div
            className="tab-switch-slider bg-primary"
            style={{
              transform: activeTab === "lost" 
                ? "translateX(0)" 
                : "translateX(100%)",
            }}
          />
          <div
            className={`tab ${activeTab === "lost" ? "active" : ""}`}
            onClick={() => handleTabToggle("lost")}
          >
            Lost
          </div>
          <div
            className={`tab ${activeTab === "found" ? "active" : ""}`}
            onClick={() => handleTabToggle("found")}
          >
            Found
          </div>
        </div>
  
        {/* Pet Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Pet Name</label>
          <input
            type="text"
            required
            className="mt-1 p-3 w-full border rounded-2xl"
            placeholder="Enter pet name"
            value={petName}
            onChange={(e) => setPetName(e.target.value)}
          />
        </div>
  
        {/* Pet Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Pet Type</label>
          <select
            className="mt-1 p-3 w-full border rounded-2xl"
            value={petType}
            required
            onChange={(e) => setPetType(e.target.value)}
          >
            <option value="">Select pet type</option>
            {petCategories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
  
        {/* Breed */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Breed</label>
          <input
            type="text"
            className="mt-1 p-3 w-full border rounded-2xl"
            placeholder="Enter breed"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </div>
  
        {/* Found Date (Conditional Display) */}
        {activeTab === "found" && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Date Found</label>
            <input
              type="date"
              className="mt-1 p-3 w-full border rounded-2xl"
              value={foundDate}
              onChange={(e) => setFoundDate(e.target.value)}
            />
          </div>
        )}
  
        {/* Contact Information */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Contact Information</label>
          <input
            type="text"
            className="mt-1 p-3 w-full border rounded-2xl"
            placeholder="Enter contact details"
            value={contactInfo}
            onChange={(e) => setContactInfo(e.target.value)}
          />
        </div>
  
        <button type="submit" className="mt-4 p-3 bg-primary text-white rounded-3xl w-full">
          Submit Listing
        </button>
      </form>
    </div>
  );
  
};

export default LostFoundListingPage;
