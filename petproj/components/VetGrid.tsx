import React from "react";
import { Vet } from '../app/types/vet';
import Link from "next/link"; // Import Link from next/link
import 'bootstrap-icons/font/bootstrap-icons.css';


interface VetGridProps {
  vets: Vet[];
}

const VetGrid: React.FC<VetGridProps> = ({ vets }) => {
  return (
    <div className="grid grid-cols-1 gap-8">
      {vets.map((vet) => (
        <div
          key={vet.vet_id}
          className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-[#A03048] "
        >
          {/* Starting Fee in Top Right Corner */}
          <div className="absolute top-4 right-4 bg-white text-sm text-primary font-bold py-1 px-3 rounded-lg">
            Starting Fee: PKR {vet.minimum_fee}
          </div>

          <div className="flex">
            {/* Profile Image */}
            <img
              src={vet.profile_image_url || "/placeholder.jpg"}
              alt={vet.name}
              className="w-28 h-26 object-cover rounded-full mr-4"
            />

            {/* Vet Details */}
            <div className="flex-grow">
              {/* Name as Link */}
              <div className="flex items-center">
                <Link href={`/pet-care/${vet.vet_id}`} className="font-bold text-xl text-primary hover:underline">
                  {vet.name}
                </Link>
                {vet.profile_verified && (
                  <i className="bi bi-patch-check-fill text-[#cc8800] ml-2" />
                )}
              </div>
{/*ffd000 */}

              {/* Clinic, City, and Location */}
              <p className="text-gray-600">{vet.clinic_name}</p>
              <p className="text-gray-500">{vet.city_name}</p>
              <p className="text-gray-500">{vet.location}</p>

              {/* Qualifications Inline Format */}
              {vet.qualifications.length > 0 && (
                <p className="text-gray-600 mb-1">
                  {vet.qualifications.map((qual, index) => (
                    <span key={index}>
                      {qual.qualification_name} ({qual.year_acquired})
                      {index < vet.qualifications.length - 1 && " | "}
                    </span>
                  ))}
                </p>
              )}
            </div>

            {/* Contact Number */}
            <div className="flex flex-col justify-end items-end ml-4">
              <Link href={`tel:${vet.contact_details}`} className="bg-primary text-white px-4 py-2 rounded-xl font-semibold hover:bg-primary">
                Book Appointment
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>


  );
};

export default VetGrid;