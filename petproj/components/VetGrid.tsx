import React, { useState } from "react";
import { Vet } from "../app/types/vet";
import Link from "next/link";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button, message } from "antd";
import { CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";

interface VetGridProps {
  vets: Vet[];
}

const VetGrid: React.FC<VetGridProps> = ({ vets }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedVet, setSelectedVet] = useState<Vet | null>(null);

  useSetPrimaryColor();

  const handleWhatsApp = (phone: string) => {
    let formattedPhone = phone.trim();
    if (formattedPhone.startsWith("0")) {
      formattedPhone = "+92" + formattedPhone.slice(1);
    } else if (!formattedPhone.startsWith("+92")) {
      message.error("Invalid phone number format. Please use a valid Pakistani number.");
      return;
    }
    const whatsappUrl = `https://wa.me/${formattedPhone}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success("Copied to clipboard!");
  };

  const openModal = (vet: Vet) => {
    setSelectedVet(vet);
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    setSelectedVet(null);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {vets.map((vet) => (
        <Link key={vet.vet_id} href={`/pet-care/${vet.vet_id}`}>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary">
            {/* Image + Details */}
            <div className="flex flex-col sm:flex-row">
              <img
                src={vet.profile_image_url || "/placeholder.jpg"}
                alt={vet.name}
                className="w-24 h-24 object-cover rounded-full sm:mr-4 mb-4 sm:mb-0"
              />
              <div className="flex-grow">
                <div className="flex flex-wrap items-center gap-x-2">
                  <div className="font-bold text-xl text-primary">{vet.name}</div>
                  {vet.profile_verified && <i className="bi bi-patch-check-fill text-[#cc8800]" />}
                </div>
                <p className="text-gray-600">{vet.clinic_name}</p>
                <p className="text-gray-500">{vet.city_name}</p>
                <p className="text-gray-500">{vet.location}</p>
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
            </div>

            {/* Fee Badge - Placed in its own row to avoid overlap */}
            <div className="mt-2 bg-gray-100 text-sm text-primary font-bold py-1 px-3 rounded-lg w-fit">
              Fee Starting from: PKR {vet.minimum_fee}
            </div>

            {/* Book Appointment Button - Right Aligned */}
            <div className="mt-4">
              <button
                className="bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white cursor-pointer transition-all duration-300 hover:scale-105 hover:bg-primary/150"
                onClick={(e) => {
                  e.preventDefault();
                  openModal(vet);
                }}
              >
                Book Appointment
              </button>
            </div>


          </div>
        </Link>
      ))}

      <Modal
        title="Contact Information"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        className="rounded-lg"
      >
        {selectedVet && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">{selectedVet.contact_details}</p>
                <p className="text-sm text-gray-500">Phone Number</p>
              </div>
              <Button
                icon={<CopyOutlined className="text-primary" />}
                size="small"
                onClick={() => handleCopy(selectedVet.contact_details)}
                className="border-none shadow-none"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
              <div>
                <p className="font-medium text-gray-700">{selectedVet.email}</p>
                <p className="text-sm text-gray-500">Email Address</p>
              </div>
              <Button
                icon={<CopyOutlined className="text-primary" />}
                size="small"
                onClick={() => handleCopy(selectedVet.email)}
                className="border-none shadow-none"
              />
            </div>

            <Button
              type="primary"
              block
              icon={<WhatsAppOutlined />}
              className="bg-green-500 hover:bg-green-600 text-white h-12 rounded-lg flex items-center justify-center"
              onClick={() => handleWhatsApp(selectedVet.contact_details)}
            >
              Message via WhatsApp
            </Button>
          </div>)}
      </Modal>
    </div>
  );
};

export default VetGrid;
