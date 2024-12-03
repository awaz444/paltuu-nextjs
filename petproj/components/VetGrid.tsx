import React from "react";
import { Vet } from '../app/types/vet';
import Link from "next/link"; // Import Link from next/link
import 'bootstrap-icons/font/bootstrap-icons.css';
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface VetGridProps {
  vets: Vet[];
}

const VetGrid: React.FC<VetGridProps> = ({ vets }) => {
  const handleWhatsApp = (phone: string) => {
    // Ensure the phone number starts with +92
    let formattedPhone = phone.trim();

    useSetPrimaryColor();

    // Check if the number starts with 0 (e.g., 03001234567) and replace with +92
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+92" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("+92")) {
      // If the number doesn't start with +92, assume invalid format
      alert("Invalid phone number format. Please use a valid Pakistani number.");
      return;
    }

    // Generate WhatsApp URL
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      {vets.map((vet) => (
        <Link key={vet.vet_id} href={`/pet-care/${vet.vet_id}`}>
          <div
            key={vet.vet_id}
            className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary"
          >
            {/* Starting Fee in Top Right Corner */}
            <div className="absolute top-4 right-4 bg-white text-sm text-primary font-bold py-1 px-3 rounded-lg">
              Fee Starting from: PKR {vet.minimum_fee}
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
                  <div className="font-bold text-xl text-primary">
                    {vet.name}
                  </div>
                  {vet.profile_verified && (
                    <i className="bi bi-patch-check-fill text-[#cc8800] ml-2" />
                  )}
                </div>

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

              {/* Contact Buttons */}
              <div className="flex flex-col justify-end items-end ml-4">
                <div className="bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white hover:border-primary hover:bg-[#ffffff] hover:text-primary cursor-pointer"
                onClick={(e) => {
                  e.preventDefault(); // Prevent Link from triggering
                  handleWhatsApp(vet.contact_details);
                }}>
                  Book Appointment
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default VetGrid;