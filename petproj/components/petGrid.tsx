import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../app/store/store'; // Correct path to RootState
import { Pet } from '../app/store/slices/petSlice'; // Correct path to Pet

const PetGrid = () => {
  const pets = useSelector((state: RootState) => state.pets.pets) as Pet[];

  return (
    <div className="grid grid-cols-3 gap-4">
      {pets.map((pet) => (
        <div key={pet.pet_id} className="bg-white p-4 rounded-lg shadow-md">
          {/* <img 
            src={pet.image || '/default-image.jpg'} 
            alt={pet.pet_name} 
            className="w-full h-40 object-cover rounded-t-lg" 
          /> */}
          <div className="p-2">
            <h3 className="font-bold text-xl">{pet.pet_name}</h3>
            <p>Breed: {pet.pet_breed}</p>
            <p>Age: {pet.age} years</p>
            <p>Adoption Status: {pet.adoption_status}</p>
            <p>Price: {pet.adoption_price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PetGrid;
