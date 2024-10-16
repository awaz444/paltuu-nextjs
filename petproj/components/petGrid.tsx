import React from 'react';
import { Pet } from '../app/store/slices/petSlice'; // Correct path to Pet

interface PetGridProps {
  pets: Pet[]; // Define a prop type for the pets array
}

const PetGrid: React.FC<PetGridProps> = ({ pets }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {pets.map((pet) => (
        <div key={pet.pet_id} className="bg-white p-4 rounded-3xl shadow-sm">
          <div className="p-2">
            <h3 className="font-bold text-xl">{pet.pet_name}</h3>
            <p>Breed: {pet.pet_breed}</p>
            <p>Age: {pet.age} years</p>
            <p>Price: {pet.adoption_price}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PetGrid;
