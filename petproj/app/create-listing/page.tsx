'use client';
import { useState } from 'react';

export default function CreateListing() {
  const [formData, setFormData] = useState({
    owner_id: '',
    pet_name: '',
    pet_type: '',
    pet_breed: '',
    city_id: '',
    area: '',
    age: '',
    description: '',
    adoption_status: 'available',
    adoption_price: '0.00',
    min_age_of_children: '',
    can_live_with_dogs: false,
    can_live_with_cats: false,
    must_have_someone_home: false,
    energy_level: '',
    cuddliness_level: '',
    health_issues: '',
    sex: '',
    listing_type: 'adoption',
    vaccinated: false,
    neutered: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        window.location.href = '/browse-pets'; 
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error creating pet listing');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError('Error creating pet listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 bg-gray-100 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-6">Create a Pet Listing</h1>
      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4 w-full max-w-lg">
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pet_name">Pet Name</label>
          <input
            type="text"
            name="pet_name"
            value={formData.pet_name}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>

        {/* Add form fields for each attribute */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="pet_type">Pet Type</label>
          <input
            type="text"
            name="pet_type"
            value={formData.pet_type}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>

        {/* City, Area, Age, and Description */}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="city_id">City ID</label>
          <input
            type="number"
            name="city_id"
            value={formData.city_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
            required
          />
        </div>

        {/* More fields for sex, listing type, etc. */}

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`bg-primary text-white font-bold py-2 px-4 rounded ${loading ? 'bg-gray-500' : 'hover:bg-blue-700'}`}
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Create Listing'}
          </button>
        </div>
        
        {error && <p className="text-red-500 mt-4">{error}</p>}
      </form>
    </main>
  );
}
