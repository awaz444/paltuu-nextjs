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
    <div className="grid grid-cols-1 gap-8">
      {vets.map((vet) => (
        <Link key={vet.vet_id} href={`/pet-care/${vet.vet_id}`}>
          <div
            key={vet.vet_id}
            className="relative bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary"
          >
            <div className="absolute top-4 right-4 bg-white text-sm text-primary font-bold py-1 px-3 rounded-lg">
              Fee Starting from: PKR {vet.minimum_fee}
            </div>

            <div className="flex">
              <img
                src={vet.profile_image_url || "/placeholder.jpg"}
                alt={vet.name}
                className="w-28 h-26 object-cover rounded-full mr-4"
              />
              <div className="flex-grow">
                <div className="flex items-center">
                  <div className="font-bold text-xl text-primary">{vet.name}</div>
                  {vet.profile_verified && (
                    <i className="bi bi-patch-check-fill text-[#cc8800] ml-2" />
                  )}
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
              <div className="flex flex-col justify-end items-end ml-4">
                <div
                  className="bg-primary text-white px-4 py-2 rounded-xl font-semibold border border-white hover:border-primary hover:bg-[#ffffff] hover:text-primary cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault(); // Prevent Link from triggering
                    openModal(vet);
                  }}
                >
                  Book Appointment
                </div>
              </div>
            </div>
          </div>
        </Link>
      ))}
      <Modal
        title="Contact Information"
        visible={isModalVisible}
        onCancel={closeModal}
        footer={null}
      >
        {selectedVet && (
          <div>
            <p>
              <strong>Phone:</strong> {selectedVet.contact_details}{" "}
              <Button
                icon={<CopyOutlined />}
                className="ml-2"
                size="small"
                onClick={() => handleCopy(selectedVet.contact_details)}
              >
                Copy
              </Button>
            </p>
            <p>
              <strong>Email:</strong> {selectedVet.email}{" "}
              <Button
                icon={<CopyOutlined />}
                className="ml-2"
                size="small"
                onClick={() => handleCopy(selectedVet.email)}
              >
                Copy
              </Button>
            </p>
            <Button
              type="primary"
              className="bg-primary text-white mt-4"
              icon={<WhatsAppOutlined />}
              onClick={() => handleWhatsApp(selectedVet.contact_details)}
            >
              WhatsApp
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default VetGrid;
