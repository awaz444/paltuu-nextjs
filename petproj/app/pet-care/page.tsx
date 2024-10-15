'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVets } from '../store/slices/vetSlice'; 
import Navbar from '@/components/navbar';
import { RootState, AppDispatch } from '../store/store'; 

export default function PetCare() {
  const dispatch = useDispatch<AppDispatch>();

  const { vets, loading, error } = useSelector((state: RootState) => state.vets);

  useEffect(() => {
    dispatch(fetchVets());
  }, [dispatch]);

  return (
    <>
      <Navbar />
      <main className="flex min-h-screen flex-col items-center p-24" style={{ backgroundColor: 'rgb(var(--background-color))' }}>
        <h1 className="text-2xl font-bold mt-0">Meet Our Vets</h1>

        {loading ? (
          <p>Loading vets...</p>
        ) : error ? (
          <p>Error: {error}</p>
        ) : vets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
            {vets.map((vet) => (
              <div key={vet.vet_id} className="border rounded-lg shadow p-4 bg-white max-w-xs">
                <h2 className="text-xl font-bold">{vet.clinic_name}</h2>
                <p className="text-gray-500">Location: {vet.location}</p>
                <p className="text-gray-500">Minimum Fee: PKR {vet.minimum_fee}</p>
                <p className="text-gray-500">Contact: {vet.contact_details}</p>
                <p className="text-gray-500">Bio: {vet.bio}</p>
                <p className={`text-sm ${vet.profile_verified ? 'text-green-500' : 'text-red-500'}`}>
                  {vet.profile_verified ? 'Verified' : 'Not Verified'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>No vets available at the moment.</p>
        )}
      </main>
    </>
  );
}
