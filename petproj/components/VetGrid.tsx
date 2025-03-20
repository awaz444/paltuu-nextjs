import React, { useState } from "react";
import { Vet } from "../app/types/vet";
import Link from "next/link";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Modal, Button, message } from "antd";
import { CopyOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import PhoneOutlined from "@ant-design/icons/PhoneOutlined";

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
      {vets.map((vet) => {
        const formattedName = vet.name.match(/^dr\.?\s*/i)
          ? vet.name
          : `Dr. ${vet.name}`;

        return (
          <Link
            key={vet.vet_id}
            href={`/pet-care/${vet.vet_id}`}
            className="h-full"
          >
            <div className="h-full flex flex-col bg-white p-4 rounded-2xl shadow-sm border-2 border-transparent hover:border-primary relative overflow-hidden"> {/* Added overflow-hidden */}
              {/* Call Button - Top Right */}
              <button
                className="absolute top-2 right-2 bg-primary text-white p-2 rounded-xl w-10 h-10 flex items-center justify-center shadow-md hover:scale-105 transition-all duration-300 z-10"
                onClick={(e) => {
                  e.preventDefault();
                  openModal(vet);
                }}
                title="Call Clinic"
              >
                <PhoneOutlined />
              </button>

              {/* Content Area */}
              <div className="flex-grow flex flex-col min-h-0"> {/* Added min-h-0 for proper flex containment */}
                <div className="flex flex-col sm:flex-row">
                  <img
                    src={vet.profile_image_url || "/placeholder.jpg"}
                    alt={vet.name}
                    className="w-24 h-24 object-cover rounded-full sm:mr-4 mb-4 sm:mb-0 flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0"> {/* Added min-w-0 for proper truncation */}
                    <div className="flex flex-wrap items-center gap-x-2">
                      <div className="font-bold text-xl text-primary truncate max-w-[calc(100%-28px)]">
                        {formattedName}
                      </div>
                      {vet.profile_verified && <i className="bi bi-patch-check-fill text-[#cc8800]" />}
                    </div>
                    <p className="text-gray-700 truncate max-w-full">{vet.clinic_name}</p>
                    <p className="text-gray-600 truncate max-w-full">{vet.city_name}</p>
                    <p className="text-gray-600 truncate max-w-full">{vet.location}</p>
                    {vet.qualifications.length > 0 && (
                      <div className="mt-2 text-gray-500 line-clamp-2 break-words">
                        {vet.qualifications.map((qual, index) => (
                          <span
                            key={index}
                            className="inline-block max-w-full truncate"
                          >
                            {qual.qualification_name} ({qual.year_acquired})
                            {index < vet.qualifications.length - 1 && ", "}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Fee Badge */}
              <div className="mt-auto pt-2 bg-gray-100 text-sm text-primary font-bold py-1 px-3 rounded-lg w-fit">
                Fee Starting from: PKR {vet.minimum_fee}
              </div>
            </div>
          </Link>
        )
      })}
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
