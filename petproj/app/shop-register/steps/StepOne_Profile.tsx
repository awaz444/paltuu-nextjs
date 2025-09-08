"use client";
import React from "react";
import { Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface StepOneData {
  shopName: string;
  address: string;
  logo: File | null;
}

interface StepOneProps {
  data: StepOneData;
  setData: (updatedData: Partial<StepOneData>) => void;
  next: () => void;
  back: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ data, setData, next, back }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setData({ [name]: value });
  };

  const handleLogoChange = (file: File | null) => {
    setData({ logo: file });
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Shop Profile</h2>
      <p className="text-gray-600 text-center mb-6">
        Tell us about your shop
      </p>

      {/* Shop Name */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Shop Name
        </label>
        <input
          type="text"
          name="shopName"
          value={data.shopName}
          onChange={handleChange}
          placeholder="Paws & Claws Pet Store"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
      </div>

      {/* Address */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Address
        </label>
        <input
          type="text"
          name="address"
          value={data.address}
          onChange={handleChange}
          placeholder="123 Pet Street, City"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
      </div>

      {/* Logo Upload */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Shop Logo
        </label>
        <Upload
          listType="picture-card"
          showUploadList={false}
          beforeUpload={(file) => {
            handleLogoChange(file);
            return false;
          }}
        >
          {data.logo ? (
            <img 
              src={URL.createObjectURL(data.logo)} 
              alt="Shop logo" 
              className="w-full h-full object-cover"
            />
          ) : (
            <div>
              <PlusOutlined />
              <div style={{ marginTop: 8 }}>Upload Logo</div>
            </div>
          )}
        </Upload>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={back}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
        >
          Back
        </button>
        <button
          type="button"
          onClick={next}
          disabled={!data.shopName || !data.address || !data.logo}
          className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
            !data.shopName || !data.address || !data.logo
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-primary-dark"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepOne;