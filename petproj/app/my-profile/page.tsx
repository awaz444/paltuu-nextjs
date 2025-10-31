"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "next-auth/react";
import {
  CameraOutlined,
  LoadingOutlined,
  LockOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { Modal, Input, Form, message } from "antd";
import "./styles.css";

interface UserProfileData {
  user_id: string;
  name: string;
  dob: string;
  email: string;
  profile_image_url: string;
  phone_number: string;
  city: string;
  created_at: string;
}

interface City {
  city_id: string;
  city_name: string;
}

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

interface ProfileFieldProps {
  label: string;
  name: string;
  value: string;
  type?: string;
  editable?: boolean;
  cities?: City[];
  onChange?: (name: string, value: string) => void;
  editing?: boolean;
}

const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  name,
  value,
  type = "text",
  editable = true,
  cities = [],
  onChange,
  editing = false,
}) => {
  const handleChange = (newValue: string) => {
    onChange?.(name, newValue);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-600">{label}</label>
      {editing && editable ? (
        name === "city" ? (
          <select
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city.city_id} value={city.city_name}>
                {city.city_name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value || ""}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm lg:text-base"
            disabled={!editable}
          />
        )
      ) : (
        <p className="p-2 bg-gray-50 rounded-lg text-sm lg:text-base">
          {name === "city"
            ? cities.find((city) => city.city_name === value)?.city_name ||
              value ||
              "Not provided"
            : value || "Not provided"}
        </p>
      )}
    </div>
  );
};

const MyProfile = () => {
  const { refreshUser, user } = useAuth();
  const { data: session, status } = useSession();
  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();
  const [cities, setCities] = useState<City[]>([]);

  const handlePersonalInfoChange = (
    field: keyof UserProfileData,
    value: string
  ) => {
    setUpdatedData((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null
    );
  };

  const handlePasswordChange = async (values: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      if (values.newPassword !== values.confirmPassword) {
        throw new Error("New passwords don't match");
      }

      if (!passwordRegex.test(values.newPassword)) {
        throw new Error(
          "Password must contain at least 8 characters, including uppercase, lowercase, number, and special character"
        );
      }

      const res = await fetch(`/api/change-password/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Password change failed");
      }

      message.success("Password changed successfully");
      setPasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      message.error(error.message || "Failed to change password");
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      // Get user from NextAuth session instead of localStorage
      if (status === "loading") {
        return; // Wait for session to load
      }

      if (!session?.user || !user?.id) {
        setLoading(false);
        return;
      }

      const userIdFromSession = user.id || (session.user as any).user_id;
      setUserId(userIdFromSession);
      console.log("🔍 Profile page - Session user data:", session.user);

      try {
        // Fetch user profile data
        const res = await fetch(`/api/my-profile/${userIdFromSession}`);
        console.log("🔍 Profile page - API response status:", res.status);

        if (!res.ok) throw new Error("Failed to fetch profile");
        const profileData = await res.json();
        console.log("🔍 Profile page - Database profile data:", profileData);

        // Use session data as fallback if database data is missing or empty
        const finalProfileData = {
          ...profileData,
          name:
            (profileData.name && profileData.name.trim()) ||
            user.name ||
            session.user.name ||
            "User",
          profile_image_url:
            (profileData.profile_image_url &&
              profileData.profile_image_url.trim()) ||
            user.profile_image_url ||
            session.user.image ||
            "/default-avatar.png",
          email: profileData.email || user.email || session.user.email || "",
        };

        console.log("🔍 Profile page - Final profile data:", finalProfileData);
        setData(finalProfileData);
        setUpdatedData(finalProfileData);

        // Fetch cities data
        const citiesRes = await fetch("/api/cities");
        if (!citiesRes.ok) throw new Error("Failed to fetch cities");
        const citiesData = await citiesRes.json();
        setCities(citiesData);
      } catch (error) {
        console.error("Error loading data:", error);
        console.log("🔍 Profile page - Using fallback data from session");

        // If database fetch fails, use session data as fallback
        const fallbackData = {
          user_id: userIdFromSession,
          name: user.name || session.user.name || "User",
          dob: "",
          email: user.email || session.user.email || "",
          profile_image_url:
            user.profile_image_url || session.user.image || "/default-avatar.png",
          phone_number: "",
          city: "",
          created_at: new Date().toISOString(),
        };

        console.log("🔍 Profile page - Fallback data:", fallbackData);
        setData(fallbackData);
        setUpdatedData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [session, status, user]);

  const handleImageUpload = async (file: File) => {
    if (!userId) return;

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`/api/update-profile-image/${userId}`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) throw new Error("Upload failed");
      const { url } = await uploadRes.json();

      setUpdatedData((prev) =>
        prev ? { ...prev, profile_image_url: url } : null
      );
      setData((prev) => (prev ? { ...prev, profile_image_url: url } : null));

      // Refresh the AuthContext to update navbar
      await refreshUser();
    } catch (error) {
      Modal.error({
        title: "Upload Failed",
        content: "Could not update profile image",
      });
    } finally {
      setImageLoading(false);
    }
  };

  const handleSaveChanges = async () => {
    if (!userId || !updatedData) return;

    try {
      const res = await fetch(`/api/my-profile/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error("Update failed");

      const result = await res.json();
      setData(result.user);
      setUpdatedData(result.user);
      setEditing(false);

      // Refresh the AuthContext to update navbar
      await refreshUser();

      message.success({
        content: "Profile updated successfully",
        duration: 3,
      });
    } catch (error) {
      message.error({
        content: "Failed to update profile",
        duration: 3,
      });
    }
  };

  const handleCancel = () => {
    setUpdatedData(data);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingOutlined className="text-4xl text-primary animate-spin" />
      </div>
    );
  }

  if (!data || !updatedData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Failed to load profile data</p>
      </div>
    );
  }
  return (
    <>
      {/* Page Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
        {/* Updated Header */}
        <header className="bg-white text-primary border border-primary p-3 sm:p-4 md:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-md sm:shadow-lg mb-4 sm:mb-6 md:mb-8 lg:mb-10">
          <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
            {/* Logo - Much more compact on mobile */}
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg sm:rounded-xl bg-primary flex items-center justify-center shadow-sm sm:shadow-md">
              <img
                className="p-1 sm:p-1.5 md:p-0 w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 object-contain"
                src="/favicon-dark.png"
                alt="paltuu logo"
              />
            </div>

            {/* Text Section - Better mobile typography */}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl text-black font-bold mb-0.5 sm:mb-1 md:mb-2 leading-tight">
                My Profile
              </h1>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg text-black/80 leading-relaxed">
                Manage your personal information and security settings
              </p>
            </div>
          </div>
        </header>

        <div className="bg-white rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
          {/* Profile Content Header */}
          <div className="flex flex-wrap justify-between items-center gap-3 sm:gap-4 mb-4 sm:mb-6 lg:mb-8 pb-4 sm:pb-6 border-b border-gray-100">
            {/* Left Side: Name & Info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-gray-900 truncate">
                {data.name}
              </h2>
              <p className="text-gray-500 mt-1 sm:mt-2 flex items-center text-xs sm:text-sm lg:text-base">
                <svg
                  className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 text-primary flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Member since {format(new Date(data.created_at), "MMM yyyy")}
              </p>
            </div>

            {/* Right Side: Buttons */}
            <div className="flex flex-nowrap gap-2 sm:gap-3 justify-end">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all flex items-center gap-1 sm:gap-2 font-medium text-sm sm:text-base"
                  >
                    <CloseOutlined className="text-xs sm:text-sm" />
                    <span className="hidden xs:inline">Cancel</span>
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 sm:gap-2 font-medium text-sm sm:text-base shadow-md"
                  >
                    <CheckOutlined className="text-xs sm:text-sm" />
                    <span className="hidden xs:inline">Save</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all flex items-center gap-1 sm:gap-2 font-medium text-sm sm:text-base shadow-md"
                >
                  <EditOutlined className="text-xs sm:text-sm" />
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {/* Profile Picture Section */}
            <div className="lg:col-span-1 flex flex-col items-center">
              <div className="relative group mb-3 sm:mb-4">
                <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 xl:w-40 xl:h-40 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 p-1">
                  <img
                    className="w-full h-full rounded-full object-cover border-4 border-white shadow-lg"
                    src={data.profile_image_url || "/placeholder.jpg"}
                    alt={data.name}
                  />
                </div>
                {editing && (
                  <>
                    <input
                      type="file"
                      id="profileImage"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleImageUpload(e.target.files[0])
                      }
                    />
                    <label
                      htmlFor="profileImage"
                      className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-all duration-300"
                    >
                      {imageLoading ? (
                        <LoadingOutlined className="text-lg sm:text-xl lg:text-2xl text-white" />
                      ) : (
                        <div className="bg-primary p-2 sm:p-3 rounded-full">
                          <CameraOutlined className="text-base sm:text-lg lg:text-xl text-white" />
                        </div>
                      )}
                    </label>
                  </>
                )}
              </div>
              {editing && (
                <p className="text-xs sm:text-sm text-gray-500 text-center mt-1 sm:mt-2">
                  Click image to update
                </p>
              )}
            </div>

            {/* Profile Details */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
                    Full Name
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={updatedData?.name || ""}
                      onChange={(e) =>
                        handlePersonalInfoChange("name", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm sm:text-base"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {updatedData?.name || "Not provided"}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
                    Email Address
                  </label>
                  <p className="text-gray-900 font-medium text-sm sm:text-base">
                    {updatedData?.email || "Not provided"}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
                    Phone Number
                  </label>
                  {editing ? (
                    <div className="flex space-x-2">
                      <div className="flex items-center px-2 sm:px-3 bg-gray-100 rounded-lg text-gray-600 border border-gray-300 text-sm sm:text-base">
                        +92
                      </div>
                      <input
                        type="text"
                        value={updatedData?.phone_number || ""}
                        onChange={(e) =>
                          handlePersonalInfoChange(
                            "phone_number",
                            e.target.value
                          )
                        }
                        placeholder="3338888666"
                        className="flex-1 p-2 sm:p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm sm:text-base"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {updatedData?.phone_number
                        ? `+92${updatedData.phone_number}`
                        : "Not provided"}
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-3 sm:p-4 rounded-lg sm:rounded-xl">
                  <label className="text-xs sm:text-sm font-medium text-gray-600 mb-1 sm:mb-2 block">
                    City
                  </label>
                  {editing ? (
                    <select
                      value={updatedData?.city || ""}
                      onChange={(e) =>
                        handlePersonalInfoChange("city", e.target.value)
                      }
                      className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors text-sm sm:text-base"
                    >
                      <option value="">Select City</option>
                      {cities.map((city) => (
                        <option key={city.city_id} value={city.city_name}>
                          {city.city_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900 font-medium text-sm sm:text-base">
                      {cities.find(
                        (city) => city.city_name === updatedData?.city
                      )?.city_name ||
                        updatedData?.city ||
                        "Not provided"}
                    </p>
                  )}
                </div>
              </div>

              {/* Security Section */}
              <div className="border-t border-gray-100 pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Security
                </h3>
                <button
                  onClick={() => setPasswordModalVisible(true)}
                  className="px-3 py-2 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 bg-primary/10 text-primary rounded-lg sm:rounded-xl hover:bg-primary/20 transition-all flex items-center gap-2 font-medium text-sm sm:text-base w-full sm:w-auto justify-center"
                >
                  <LockOutlined />
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Change Modal */}
        <Modal
          title={
            <div className="text-lg sm:text-xl font-semibold text-gray-900">
              Change Password
            </div>
          }
          open={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
          destroyOnClose
          width={400}
          className="custom-modal"
          styles={{
            body: { padding: "16px 20px" },
          }}
        >
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordChange}
            className="mt-4 sm:mt-6"
          >
            <Form.Item
              label="Current Password"
              name="currentPassword"
              rules={[
                {
                  required: true,
                  message: "Please input your current password!",
                },
              ]}
            >
              <Input.Password
                placeholder="Enter current password"
                size="large"
                className="rounded-lg text-sm sm:text-base"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: "Please input new password!" },
                () => ({
                  validator(_, value) {
                    if (!value || passwordRegex.test(value)) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character"
                      )
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Enter new password"
                size="large"
                className="rounded-lg text-sm sm:text-base"
              />
            </Form.Item>

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={["newPassword"]}
              rules={[
                {
                  required: true,
                  message: "Please confirm your new password!",
                },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error("Passwords do not match!"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm new password"
                size="large"
                className="rounded-lg text-sm sm:text-base"
              />
            </Form.Item>

            <Form.Item>
              <button
                type="submit"
                className="w-full px-4 py-3 bg-primary text-white rounded-xl transition-all flex items-center justify-center gap-2 font-medium text-sm sm:text-base"
              >
                Change Password
              </button>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </>
  );
};

export default MyProfile;
