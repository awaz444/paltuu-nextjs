'use client'; // Ensure this is at the top of your file
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPets } from '../store/slices/petSlice'; 
import Navbar from '@/components/navbar';
import Footer from '@/components/footer';
import VerticalSearchBar from '../../components/VerticalSearchBar'; // Adjusted import path
import FilterSection from '../../components/FilterSection'; // Adjusted import path
import PetGrid from '../../components/petGrid'; // Adjusted import path
import { RootState, AppDispatch } from '../store/store'; 

export default function BrowsePets() {
  const dispatch = useDispatch<AppDispatch>();

  // Access pets, loading, and error from Redux state
  const { pets, loading, error } = useSelector((state: RootState) => state.pets);

  useEffect(() => {
    dispatch(fetchPets());
  }, [dispatch]);

  // Filter pets for adoption
  const adoptionPets = pets.filter(pet => pet.listing_type === 'adoption');

  return (
    <>

      <Navbar />

      <FilterSection />
      
      <main className="flex min-h-screen flex-col items-center p-8 bg-gray-100">

        {/* Top Filter Section */}

        <div className="flex w-full ">
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
      </main>
    </>
  );
}
