'use client'; // Ensure this is at the top of your file
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets } from '../store/slices/petSlice'; 
import Navbar from '@/components/navbar';
import { RootState, AppDispatch } from '../store/store'; 

export default function FosterPets() {
  const dispatch = useDispatch<AppDispatch>();

  // Access pets, loading, and error from Redux state
  const { pets, loading, error } = useSelector((state: RootState) => state.pets);

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  // Filter pets for foster
  const fosterPets = pets.filter(pet => pet.listing_type === 'foster');

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>
        {/* Pets Listing */}
        <h1 className="text-2xl font-bold mt-0">Pets Available for Foster</h1>

        {loading ? (
          <p>Loading pets...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : fosterPets.length > 0 ? (
          <ul className="mt-4 w-full">
            {fosterPets.map((pet) => (
              <li key={pet.pet_id} className="border p-4 mb-2 rounded shadow">
                <h2 className="text-xl">{pet.pet_name}</h2>
                <p>Breed: {pet.pet_breed}</p>
                <p>Age: {pet.age} years</p>
                <p>Description: {pet.description}</p>
                <p>Foster Status: {pet.adoption_status}</p>
                <p>Foster Duration: {pet.adoption_price}</p> {/* Adjust if foster duration is stored elsewhere */}
              </li>
            ))}
          </ul>
        ) : (
          <p>No pets available for foster at this time.</p>
        )}
      </main>
    </>
  );
}
