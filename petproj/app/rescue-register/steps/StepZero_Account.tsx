// steps/StepZero_Account.tsx
"use client";
import React, { useState } from "react";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

interface StepZeroProps {
  data: {
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
    phone_number: string;
    city_id: number | null;
  };
  setData: (updatedData: Partial<StepZeroProps["data"]>) => void;
  next: () => void;
  cities: Array<{ city_id: number; city_name: string }>;
}

const StepZero: React.FC<StepZeroProps> = ({ data, setData, next, cities }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof StepZeroProps["data"], value: string | number | null) => {
    setData({ [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(data.email)) newErrors.email = "Email is invalid";

    if (!data.password) newErrors.password = "Password is required";
    else if (data.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!data.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (data.password !== data.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!data.name) newErrors.name = "Full name is required";
    if (!data.phone_number) newErrors.phone_number = "Phone number is required";
    if (!data.city_id) newErrors.city_id = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      next();
    }
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Create Your Account</h2>
      <p className="text-gray-600 text-center mb-6">
        First, create your account credentials
      </p>

      {/* Email */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Email
        </label>
        <input
          type="email"
          value={data.email}
          onChange={(e) => handleInputChange("email", e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
      </div>

      {/* Password */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={data.password}
            onChange={(e) => handleInputChange("password", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none pr-10"
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
          >
            {showPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </span>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            value={data.confirmPassword}
            onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none pr-10"
            required
          />
          <span
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500"
          >
            {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
          </span>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      {/* Full Name */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Full Name
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          Phone Number
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            value="+92"
            className="w-14 border border-gray-300 pl-2 rounded-xl py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            disabled
          />
          <input
            type="text"
            value={data.phone_number}
            onChange={(e) => handleInputChange("phone_number", e.target.value)}
            placeholder="3001234567"
            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
            required
          />
        </div>
        {errors.phone_number && (
          <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>
        )}
      </div>

      {/* City */}
      <div>
        <label className="block text-gray-700 text-sm font-medium mb-1">
          City
        </label>
        <select
          value={data.city_id || ""}
          onChange={(e) => handleInputChange("city_id", e.target.value ? parseInt(e.target.value) : null)}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        >
          <option value="">Select a City</option>
          {cities.map((city) => (
            <option key={city.city_id} value={city.city_id}>
              {city.city_name}
            </option>
          ))}
        </select>
        {errors.city_id && <p className="text-red-500 text-xs mt-1">{errors.city_id}</p>}
      </div>

      {/* Navigation */}
      <div className="flex justify-center mt-6">
        <button
          type="button"
          onClick={handleNext}
          className="bg-primary text-white font-semibold py-2 px-6 rounded-xl hover:bg-primary-dark"
        >
          Continue to Shelter Details
        </button>
      </div>
    </div>
  );
};

export default StepZero;