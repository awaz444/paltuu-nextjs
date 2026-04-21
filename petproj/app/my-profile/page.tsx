"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";
import {
  CameraOutlined,
  LockOutlined,
  EditOutlined,
  CheckOutlined,
  CloseOutlined,
  UserOutlined,
  MailOutlined,
  SafetyOutlined,
} from "@ant-design/icons";
import { format } from "date-fns";
import { Modal, Input, Form, message } from "antd";
import { MoonLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import "./styles.css";

interface UserProfileData {
  user_id: string;
  name: string;
  email: string;
  profile_image_url: string;
  created_at: string;
}


const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const MyProfile = () => {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const [data, setData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [passwordForm] = Form.useForm();

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

      const res = await fetch(`/api/v1/profile/password`, {
        method: "PATCH",
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

  const fetchedRef = React.useRef(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!isAuthenticated || !user?.id || fetchedRef.current) {
        if (!isAuthenticated || !user?.id) setLoading(false);
        return;
      }

      try {
        fetchedRef.current = true;
        const res = await fetch(`/api/v1/profile`);
        if (!res.ok) throw new Error("Failed to fetch profile");
        const profileData = await res.json();

        const finalProfileData = {
          ...profileData,
          name: (profileData.name && profileData.name.trim()) || user.name || "User",
          profile_image_url: (profileData.profile_image_url && profileData.profile_image_url.trim()) || user.profile_image_url || "/default-avatar.png",
        };

        setData(finalProfileData);
        setUpdatedData(finalProfileData);
      } catch (error) {
        console.error("Error loading data:", error);
        const fallbackData = {
          user_id: user.id,
          name: user.name || "User",
          email: user.email || "",
          profile_image_url: user.profile_image_url || "/default-avatar.png",
          created_at: new Date().toISOString(),
        };
        setData(fallbackData);
        setUpdatedData(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [isAuthenticated, user]);

  const handleImageUpload = async (file: File) => {
    if (!user?.id) return;

    setImageLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch(`/api/v1/profile/avatar`, {
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

  const [primaryColor, setPrimaryColor] = useState("#A03048");

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }
  }, []);

  const handleSaveChanges = async () => {
    if (!user?.id || !updatedData) return;

    try {
      const res = await fetch(`/api/v1/profile`, {
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
      <div className="flex flex-col justify-center items-center h-screen gap-6 bg-white font-Montserrat">
        <MoonLoader size={30} color={primaryColor} />
        <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-xs">Authenticating Profile</p>
      </div>
    );
  }

  if (!isAuthenticated || !user || !data || !updatedData) {
    return (
      <div className="flex justify-center items-center h-screen bg-white font-Montserrat px-8 text-center">
        <div className="max-w-md">
          <h1 className="text-4xl font-black text-gray-900 mb-4">Unauthorized</h1>
          <p className="text-gray-500 font-medium mb-8">Please log in to manage your premium profile settings.</p>
          <button
            onClick={() => window.location.href = '/auth'}
            className="px-8 py-4 bg-primary text-white font-black rounded-3xl shadow-xl shadow-primary/20 hover:scale-105 transition-all">
            Sign In Now
          </button>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="min-h-screen bg-gray-50/50 pb-20 font-Montserrat">
        <div className="max-w-5xl mx-auto px-6 pt-12">

          {/* Header Section */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] mb-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-8">
              <div className="w-20 h-20 rounded-[1.5rem] bg-primary flex items-center justify-center p-4 shadow-2xl shadow-primary/30">
                <img src="/favicon-dark.png" alt="logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h1 className="text-4xl font-black text-gray-900 leading-tight">My Profile</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px] sm:text-xs">Security & Account Identity</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <AnimatePresence mode="wait">
                {editing ? (
                  <motion.div
                    key="editing-btns"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-4">
                    <button
                      onClick={handleCancel}
                      className="h-14 px-8 rounded-3xl border-2 border-gray-100 text-gray-400 font-black hover:bg-gray-50 transition-all flex items-center gap-2">
                      <CloseOutlined />
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveChanges}
                      className="h-14 px-10 rounded-3xl bg-primary text-white font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                      <CheckOutlined />
                      Save Profile
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="edit-btn"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setEditing(true)}
                    className="h-14 px-12 rounded-3xl bg-primary text-white font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                    <EditOutlined />
                    Edit Personal Info
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.header>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            {/* Left Side: Identity */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="lg:col-span-12 xl:col-span-4 space-y-12">

              <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] text-center">
                <div className="relative inline-block group">
                  <div className="w-48 h-48 rounded-[3.5rem] bg-gradient-to-br from-primary/20 to-primary/5 p-2 shadow-inner">
                    <img
                      className="w-full h-full rounded-[3rem] object-cover border-8 border-white shadow-2xl"
                      src={data.profile_image_url || "/placeholder.jpg"}
                      alt={data.name}
                    />
                  </div>

                  {editing && (
                    <div className="absolute inset-4 rounded-[2.5rem] bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center cursor-pointer">
                      <input
                        type="file"
                        id="profileImage"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                      />
                      <label htmlFor="profileImage" className="cursor-pointer flex flex-col items-center">
                        {imageLoading ? (
                          <MoonLoader size={20} color={primaryColor} />
                        ) : (
                          <div className="bg-primary p-4 rounded-3xl shadow-xl shadow-primary/30 transform transition-transform hover:scale-110 active:scale-95">
                            <CameraOutlined className="text-2xl text-white" />
                          </div>
                        )}
                        <span className="text-white text-[10px] font-black uppercase tracking-widest mt-4">Change Photo</span>
                      </label>
                    </div>
                  )}
                </div>

                <div className="mt-10">
                  <h2 className="text-3xl font-black text-gray-900 truncate">{data.name}</h2>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <SafetyOutlined className="text-primary" />
                    <span className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Verified Member</span>
                  </div>
                </div>

                <div className="mt-12 pt-12 border-t border-gray-50 flex justify-center gap-12">
                  <div className="text-center">
                    <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Member Since</div>
                    <div className="text-xl font-black text-gray-900">
                      {data.created_at && !isNaN(new Date(data.created_at).getTime()) 
                        ? format(new Date(data.created_at), "MMM yyyy") 
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Side: Account Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-12 xl:col-span-8 flex flex-col gap-12">

              <div className="bg-white rounded-[3rem] p-12 border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)] h-full">
                <div className="flex items-center gap-4 mb-12">
                  <UserOutlined className="text-2xl text-primary" />
                  <h3 className="text-2xl font-black text-gray-900">Personal Details</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-8 rounded-3xl bg-gray-50/50 border border-gray-50 space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 block leading-none">Full Account Name</label>
                    {editing ? (
                      <input
                        type="text"
                        value={updatedData?.name || ""}
                        onChange={(e) => handlePersonalInfoChange("name", e.target.value)}
                        className="w-full bg-white px-6 py-4 rounded-2xl border-2 border-gray-100 focus:border-primary transition-all font-black"
                      />
                    ) : (
                      <div className="text-xl font-black text-gray-900">{updatedData?.name}</div>
                    )}
                  </div>

                  <div className="p-8 rounded-3xl bg-gray-50/50 border border-gray-50 space-y-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/40 block leading-none">Email Connectivity</label>
                    <div className="flex items-center gap-3">
                      <MailOutlined className="text-primary" />
                      <div className="text-xl font-black text-gray-900">{data.email}</div>
                    </div>
                  </div>
                </div>

                {/* Security Section */}
                <div className="mt-16 pt-12 border-t border-gray-50">
                  <div className="flex items-center gap-4 mb-10">
                    <LockOutlined className="text-2xl text-primary" />
                    <h3 className="text-2xl font-black text-gray-900">Security Vault</h3>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-8 bg-black/[0.02] p-8 rounded-[2.5rem] border border-gray-50">
                    <div className="text-gray-500 font-medium">Protect your account with a high-entropy password.</div>
                    <button
                      onClick={() => setPasswordModalVisible(true)}
                      className="h-14 px-10 rounded-2xl bg-white border-2 border-gray-100 text-gray-900 font-black shadow-sm transition-all hover:shadow-xl hover:scale-[1.02] active:scale-95 flex items-center gap-3 whitespace-nowrap ml-auto">
                      <LockOutlined className="text-primary" />
                      Change Password
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Updated Password Modal */}
        <Modal
          title={null}
          open={passwordModalVisible}
          onCancel={() => setPasswordModalVisible(false)}
          footer={null}
          destroyOnClose
          width={500}
          className="premium-modal"
          centered
        >
          <div className="p-10 font-Montserrat">
            <div className="flex items-center gap-4 mb-10">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                <LockOutlined className="text-3xl text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-900">Credentials Refactor</h2>
                <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Update your security layer</p>
              </div>
            </div>

            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
              className="space-y-6"
            >
              <Form.Item
                name="currentPassword"
                rules={[{ required: true, message: "Required" }]}
                className="mb-0"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-primary/40">Current Security Key</label>
                  <Input.Password
                    placeholder="••••••••"
                    size="large"
                    className="h-16 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white font-black"
                  />
                </div>
              </Form.Item>

              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: "Required" },
                  { validator: (_, value) => !value || passwordRegex.test(value) ? Promise.resolve() : Promise.reject("Invalid complexity") }
                ]}
                className="mb-0"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-primary/40">New Security Key</label>
                  <Input.Password
                    placeholder="••••••••"
                    size="large"
                    className="h-16 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white font-black"
                  />
                </div>
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                dependencies={["newPassword"]}
                rules={[
                  { required: true, message: "Required" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      return !value || getFieldValue("newPassword") === value ? Promise.resolve() : Promise.reject("Mismatch")
                    },
                  }),
                ]}
                className="mb-0"
              >
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest font-black text-primary/40">Confirm Security Key</label>
                  <Input.Password
                    placeholder="••••••••"
                    size="large"
                    className="h-16 rounded-2xl border-2 border-gray-50 bg-gray-50/50 focus:bg-white font-black"
                  />
                </div>
              </Form.Item>

              <Form.Item className="pt-6">
                <button
                  type="submit"
                  className="w-full h-16 bg-primary text-white font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                >
                  Update Credentials
                </button>
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </div>
    </>
  );
};

export default MyProfile;
