'use client'; // Ensure this is at the top of your file
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets } from '../store/slices/petSlice'; 
import Navbar from '@/components/navbar';
import VerticalSearchBar from '../../components/VerticalSearchBar'; // Adjusted import path
import FilterSection from '../../components/FilterSection'; // Adjusted import path
import PetGrid from '../../components/petGrid'; // Adjusted import path
import { RootState, AppDispatch } from '../store/store'; 

export default function BrowsePets() {
  const dispatch = useDispatch<AppDispatch>();

  // Access loading and error from Redux state
  const { loading, error } = useSelector((state: RootState) => state.pets);

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  // Filter pets for adoption
  const adoptionPets = pets.filter(pet => pet.listing_type === 'adoption');

  return (
    <>
      <Navbar />
<<<<<<< Updated upstream
      <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>
        {/* Pets Listing */}
        <h1 className="text-2xl font-bold mt-0">Pets Available for Adoption</h1>

        {loading ? (
          <p>Loading pets...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : adoptionPets.length > 0 ? (
          <ul className="mt-4 w-full">
            {adoptionPets.map((pet) => (
              <li key={pet.pet_id} className="border p-4 mb-2 rounded shadow">
                <h2 className="text-xl">{pet.pet_name}</h2>
                <p>Breed: {pet.pet_breed}</p>
                <p>Age: {pet.age} years</p>
                <p>Description: {pet.description}</p>
                <p>Adoption Status: {pet.adoption_status}</p>
                <p>Adoption Price: {pet.adoption_price}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No pets available for adoption at this time.</p>
        )}
=======
      <FilterSection />
      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">
        <h1 className="text-2xl font-bold mt-10">Pets Available for Adoption</h1>

        {/* Top Filter Section */}

        <div className="flex w-full mt-4">
          {/* Vertical Search Bar Section */}
          <div className="w-1/4 mr-4">
            <VerticalSearchBar />
          </div>

          {/* Pets Grid Section */}
          <div className="w-3/4">
            {/* Show loading, error, or pets grid */}
            {loading ? (
              <p>Loading pets...</p>
            ) : error ? (
              <p>Error: {error}</p>
            ) : (
              <PetGrid /> 
            )}
          </div>
        </div>
>>>>>>> Stashed changes
      </main>
    </>
  );
}
