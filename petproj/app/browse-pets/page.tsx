'use client';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets } from '../store/slices/petSlice';
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import VerticalSearchBar from '../../components/VerticalSearchBar';
import FilterSection from '../../components/FilterSection';
import PetGrid from '../../components/petGrid';
import { RootState, AppDispatch } from '../store/store';

export default function BrowsePets() {
  const dispatch = useDispatch<AppDispatch>();
  const { pets, loading, error } = useSelector((state: RootState) => state.pets);

  // Filter states
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [breed, setBreed] = useState('');

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  // Filter pets based on the selected filters
  const filteredPets = pets.filter(pet => {
    const matchesCity = selectedCity ? pet.city_id === parseInt(selectedCity) : true;
    const matchesSpecies = selectedSpecies ? pet.pet_type === parseInt(selectedSpecies) : true;
    const matchesBreed = breed ? pet.pet_breed.toLowerCase().includes(breed.toLowerCase()) : true;
    const matchesAdoption = pet.listing_type === 'adoption';

    return matchesCity && matchesSpecies && matchesBreed && matchesAdoption;
  });

  return (
    <>
      <Navbar />

      <FilterSection
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        selectedSpecies={selectedSpecies}
        setSelectedSpecies={setSelectedSpecies}
        breed={breed}
        setBreed={setBreed}
      />

      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
        <div className="flex w-full ">
          {/* Vertical Search Bar Section */}
          <div className="w-1/4 mr-4">
            <VerticalSearchBar
              selectedCity={selectedCity}
              setSelectedCity={setSelectedCity}
              selectedSpecies={selectedSpecies}
              setSelectedSpecies={setSelectedSpecies}
              breed={breed}
              setBreed={setBreed}
            />
          </div>

          {/* Pets Grid Section */}
          <div className="w-3/4">
            {loading ? (
              <p>Loading pets...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : (
              <PetGrid pets={filteredPets} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
