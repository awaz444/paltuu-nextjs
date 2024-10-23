import React from "react";
import { Vet } from '../app/types/vet'; 

interface VetGridProps {
  vets: Vet[];
}

const VetGrid: React.FC<VetGridProps> = ({ vets }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
      {vets.map((vet) => (
        <div
          key={vet.vet_id}
          className="bg-white p-4 rounded-3xl shadow-sm overflow-hidden flex flex-col h-full"
        >
          <div className="flex items-center">
            <img
              src={vet.profile_image_url || "/placeholder.jpg"} // Fallback image if profile_image_url is null
              alt={vet.name}
              className="w-20 h-20 object-cover rounded-full mr-4" // Circular image
            />
            <div className="flex flex-col flex-grow">
              <h3 className="font-bold text-xl mb-1">{vet.name}</h3>
              <p className="text-gray-600 mb-1">{vet.clinic_name}</p>

              {/* List qualifications if available */}
              {vet.qualifications.length > 0 && (
                <div className="mt-2">
                  <h4 className="font-semibold">Qualifications:</h4>
                  <ul className="list-disc ml-5">
                    {vet.qualifications.map((qual, index) => (
                      <li key={index} className="text-gray-600">
                        {qual.qualification_name} ({qual.year_acquired})
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-gray-600 mb-1">City: {vet.city_name}</p>
              <p className="text-gray-600 mb-1">Area: {vet.location}</p>
              <p className="text-gray-600 mb-1">
                Minimum Fee: PKR {vet.minimum_fee}
              </p>
              <p className={`text-${vet.profile_verified ? 'green' : 'red'}-600 font-semibold`}>
                {vet.profile_verified ? "Profile Verified" : "Profile Not Verified"}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default VetGrid;
