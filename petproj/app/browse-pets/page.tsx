'use client'; // Ensure this is at the top of your file
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets } from '../store/slices/petSlice'; // Adjust import as needed
import Navbar from '@/components/navbar';
import { RootState, AppDispatch } from '../store/store'; 

export default function BrowsePets() {
  const dispatch = useDispatch<AppDispatch>();

  // Access pets, loading, and error from Redux state
  const { pets, loading, error } = useSelector((state: RootState) => state.pets);

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>
        {/* Pets Listing */}
        <h1 className="text-2xl font-bold mt-10">Pets Available for Adoption</h1>

        {loading ? (
          <p>Loading pets...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : pets.length > 0 ? (
          <ul className="mt-4 w-full">
            {pets.map((pet) => (
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
      </main>
    </>
  );
}
