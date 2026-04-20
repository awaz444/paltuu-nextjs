"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchCities } from "@/app/store/slices/citiesSlice";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

interface VetStepZeroData {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone_number: string;
  city_id: number | null;
}

const VetStepZero = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { cities } = useSelector((state: RootState) => state.cities);

  const [formData, setFormData] = useState<VetStepZeroData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone_number: "",
    city_id: null,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    dispatch(fetchCities());
  }, [dispatch]);

  const handleInputChange = (field: keyof VetStepZeroData, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid";

    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword) newErrors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    if (!formData.name) newErrors.name = "Full name is required";
    if (!formData.phone_number) newErrors.phone_number = "Phone number is required";
    if (!formData.city_id) newErrors.city_id = "City is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Create user account
      const response = await fetch("/api/v1/vet-step-zero", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.email,
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone_number: formData.phone_number,
          city_id: formData.city_id,
          role: "vet",
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.errorCode === "EMAIL_EXISTS") {
          setErrors({ email: "This email is already registered" });
        } else {
          throw new Error(result.message || "Failed to create account");
        }
        return;
      }

      // Redirect to vet registration with user ID
      router.push(`/vet-register?user_id=${result.user_id}`);
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side static - becomes header on mobile */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-primary p-4 lg:p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none lg:sticky lg:top-0 lg:h-screen">
        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-4 lg:mb-6 w-1/2 lg:w-3/4 max-w-xs lg:max-w-md"
        />
      </div>

      {/* Right side dynamic form */}
      <div className="w-full lg:w-1/2 bg-gray-100 flex flex-col items-center justify-start px-4 py-8 lg:px-8 lg:py-12 lg:h-screen lg:overflow-y-auto">
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
          <h2 className="text-2xl font-semibold text-center">Create Your Account</h2>
          <p className="text-gray-600 text-center mb-6">
            First, create your account credentials
          </p>

          {errors.general && (
            <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {errors.general}
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
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
                value={formData.password}
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
                value={formData.confirmPassword}
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
              value={formData.name}
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
                value={formData.phone_number}
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
              value={formData.city_id || ""}
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
              onClick={handleSubmit}
              disabled={isLoading}
              className={`bg-primary text-white font-semibold py-2 px-6 rounded-xl ${
                isLoading ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-dark"
              }`}
            >
              {isLoading ? "Creating Account..." : "Continue to Vet Details"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VetStepZero;