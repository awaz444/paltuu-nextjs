"use client";
import React from "react";

interface SocialsData {
  instagram: string;
  facebook: string;
  website: string;
}

interface StepThreeData {
  email: string;
  name: string;
  phone_number: string;
  city_id: number | null;
  shopName: string;
  address: string;
  accountTitle: string;
  iban: string;
  bankName: string;
  socials: SocialsData;
}

interface StepThreeProps {
  data: StepThreeData;
  cities: Array<{ city_id: number; city_name: string }>;
  back: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const StepThree: React.FC<StepThreeProps> = ({
  data,
  cities,
  back,
  onSubmit,
  isSubmitting
}) => {
  const getCityName = (cityId: number | null) => {
    if (!cityId) return "Not selected";
    const city = cities.find(c => c.city_id === cityId);
    return city ? city.city_name : "Unknown";
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Review Your Information</h2>
      <p className="text-gray-600 text-center mb-6">
        Please review all information before submitting
      </p>

      <div className="space-y-6">
        {/* Account Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Account Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{data.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Full Name:</span>
              <span className="font-medium">{data.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">+92 {data.phone_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">City:</span>
              <span className="font-medium">{getCityName(data.city_id)}</span>
            </div>
          </div>
        </div>

        {/* Shop Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Shop Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Shop Name:</span>
              <span className="font-medium">{data.shopName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Address:</span>
              <span className="font-medium">{data.address}</span>
            </div>
          </div>
        </div>

        {/* Banking Information */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Banking Information</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Account Title:</span>
              <span className="font-medium">{data.accountTitle}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">IBAN:</span>
              <span className="font-medium">{data.iban}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Bank Name:</span>
              <span className="font-medium">{data.bankName}</span>
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Social Media</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Instagram:</span>
              <span className="font-medium">{data.socials.instagram || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Facebook:</span>
              <span className="font-medium">{data.socials.facebook || "Not provided"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Website:</span>
              <span className="font-medium">{data.socials.website || "Not provided"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={back}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
          disabled={isSubmitting}
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
            isSubmitting
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary-dark"
          }`}
        >
          {isSubmitting ? "Submitting..." : "Complete Registration"}
        </button>
      </div>
    </div>
  );
};

export default StepThree;