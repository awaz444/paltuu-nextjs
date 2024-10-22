import React from "react";

interface Pet {
  pet_id: number;
  owner_id: number;
  pet_name: string;
  pet_type: number;
  pet_breed: string | null;
  city_id: number;
  area: string;
  age: number;
  description: string;
  adoption_status: string;
  price: string;
  min_age_of_children: number;
  can_live_with_dogs: boolean;
  can_live_with_cats: boolean;
  must_have_someone_home: boolean;
  energy_level: number;
  cuddliness_level: number;
  health_issues: string;
  created_at: string;
  sex: string | null;
  listing_type: string;
  vaccinated: boolean | null;
  neutered: boolean | null;
  payment_frequency: string | null;
  city: string;
  profile_image_url: string | null;
  image_id: number | null;
  image_url: string | null;
}

interface PetGridProps {
  pets: Pet[];
}

const PetGrid: React.FC<PetGridProps> = ({ pets }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {pets.map((pet) => (
        <div
          key={pet.pet_id}
          className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden"
        >
          <img
            src={pet.image_url || "/placeholder.jpg"} // Fallback image if pet.image_url is null
            alt={pet.pet_name}
            className="w-full h-48 object-cover rounded-t-2xl"
          />
          <div className="p-4">
            <h3 className="font-bold text-2xl mb-1">{pet.pet_name}</h3>
            <p className="text-gray-600 mb-1">Age: {pet.age} years</p>
            <p className="text-gray-600 mb-1">
              {pet.city} - {pet.area}
            </p>
            {/* Conditionally render the price if it's greater than zero */}
            {Number(pet.price) > 0 && (
              <p className="text-red-600 font-semibold">Price: PKR {pet.price}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PetGrid;
