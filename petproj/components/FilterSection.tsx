'use client';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import { RootState, AppDispatch } from '../app/store/store'; // Import store types
import { fetchCities } from '../app/store/slices/citiesSlice'; // Fetch cities from store
import { fetchPetCategories } from '../app/store/slices/petCategoriesSlice'; // Fetch pet categories from store
import styles from '@/styles/FilterSection.module.css';

const FilterSection = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { cities } = useSelector((state: RootState) => state.cities); // Get cities from the store
  const { categories } = useSelector((state: RootState) => state.categories); // Get pet categories (species) from the store

  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [breed, setBreed] = useState('');

  // Fetch cities and pet categories on component mount
  useEffect(() => {
    dispatch(fetchCities());
    dispatch(fetchPetCategories());
  }, [dispatch]);

  const handleReset = () => {
    setSelectedCity('');
    setSelectedSpecies('');
    setBreed('');
  };

  const handleSearch = () => {
    // Handle search logic here
    console.log('Search:', { selectedCity, selectedSpecies, breed });
  };

  return (
    <div className="bg-white shadow-xl p-6" style={{ margin: '20px', borderRadius: '2rem' }}>
      <div className="flex flex-wrap gap-4 mb-4 mt-6 items-center">
        {/* Species dropdown */}
        <div className="flex-1 min-w-[150px]">
          <label>Species</label>
          <select
            className="w-full p-3 border rounded"
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
          >
            <option value="">Select Species</option>
            {categories.map((category) => (
              <option key={category.category_id} value={category.category_id}>
                {category.category_name}
              </option>
            ))}
          </select>
        </div>

        {/* Breed input field */}
        <div className="flex-1 min-w-[150px]">
          <label>Breed</label>
          <input
            type="text"
            className="w-full p-3 border rounded"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="Enter Breed"
          />
        </div>

        {/* Cities dropdown */}
        <div className="flex-1 min-w-[150px]">
          <label>City</label>
          <select
            className="w-full p-3 border rounded"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_id}>
                {city.city_name}
              </option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button className="bg-gray-300 p-3 rounded" onClick={handleReset}>
            Reset
          </button>
          <button className="text-white p-3 rounded w-40" style={{ backgroundColor: '#A03048' }} onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterSection;
