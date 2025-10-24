"use client";
import React, { useState } from "react";
import { Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

interface StepOneProps {
  formData: any;
  setFormData: (data: any) => void;
  next: () => void;
  back: () => void;
}

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith("image/");
  if (!isImage) {
    message.error("You can only upload image files!");
  }
  const isSmallEnough = file.size / 1024 / 1024 < 5; // 5MB max size
  if (!isSmallEnough) {
    message.error("Image must be smaller than 5MB!");
  }
  return isImage && isSmallEnough;
};

const StepOne_Profile: React.FC<StepOneProps> = ({ formData, setFormData, next, back }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleUploadChange = async ({ file }: { file: UploadFile }) => {
    if (file.originFileObj) {
      try {
        const uploadFormData = new FormData();
        uploadFormData.append('file', file.originFileObj);

        const response = await fetch('/api/upload-vet-image', {
          method: 'POST',
          body: uploadFormData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();
        setFormData({ ...formData, imageUrl: data.image_url });
        message.success(`${file.name} uploaded successfully`);
      } catch (error) {
        message.error(`${file.name} file upload failed.`);
        console.error('Upload error:', error);
      }
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.clinicName) newErrors.clinicName = "Clinic name is required";
    if (!formData.clinicLocation) newErrors.clinicLocation = "Location is required";
    if (!formData.consultationFee || formData.consultationFee <= 0) newErrors.consultationFee = "Valid consultation fee is required";
    if (!formData.contactNumber) newErrors.contactNumber = "Contact number is required";
    if (!formData.bio) newErrors.bio = "Bio is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      next();
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Clinic Information</h2>
      <p className="text-gray-600 text-center mb-6">
        Tell us about your veterinary practice
      </p>

      {/* Clinic Name */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Clinic Name
        </label>
        <input
          type="text"
          value={formData.clinicName || ""}
          onChange={(e) => setFormData({ ...formData, clinicName: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Enter clinic name"
          required
        />
        {errors.clinicName && <p className="text-red-500 text-xs mt-1">{errors.clinicName}</p>}
      </div>

      {/* Location */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Location
        </label>
        <input
          type="text"
          value={formData.clinicLocation || ""}
          onChange={(e) => setFormData({ ...formData, clinicLocation: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Enter clinic location"
          required
        />
        {errors.clinicLocation && <p className="text-red-500 text-xs mt-1">{errors.clinicLocation}</p>}
      </div>

      {/* Consultation Fee */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Consultation Fee (PKR)
        </label>
        <input
          type="number"
          value={formData.consultationFee || ""}
          onChange={(e) => setFormData({ ...formData, consultationFee: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Enter consultation fee"
          required
        />
        {errors.consultationFee && <p className="text-red-500 text-xs mt-1">{errors.consultationFee}</p>}
      </div>

      {/* Contact Number */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Contact Number
        </label>
        <input
          type="tel"
          value={formData.contactNumber || ""}
          onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Enter contact number"
          required
        />
        {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
      </div>

      {/* Bio */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Bio
        </label>
        <textarea
          value={formData.bio || ""}
          onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          placeholder="Tell us about yourself and your practice"
          rows={4}
          required
        />
        {errors.bio && <p className="text-red-500 text-xs mt-1">{errors.bio}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Profile Image
        </label>
        <Upload
          name="image"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleUploadChange}
        >
          {formData.imageUrl ? (
            <img src={formData.imageUrl} alt="avatar" style={{ width: '100%' }} />
          ) : (
            uploadButton
          )}
        </Upload>
      </div>

      {errors.submit && (
        <div className="text-red-500 text-sm text-center">{errors.submit}</div>
      )}

      <div className="flex space-x-4">
        <button
          type="button"
          onClick={back}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={isLoading}
          className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </span>
          ) : (
            "Next"
          )}
        </button>
      </div>
    </div>
  );
};

export default StepOne_Profile;