"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { CameraOutlined, LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { Modal, Input, Form, message } from "antd";
import './styles.css';

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

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const MyProfile = () => {
    useSetPrimaryColor();
    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [cities, setCities] = useState<City[]>([]);

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
                    newPassword: values.newPassword
                })
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
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            setUserId(parsedUser.id);
            try {
                // Fetch user profile data
                const res = await fetch(`/api/my-profile/${parsedUser.id}`);
                if (!res.ok) throw new Error('Failed to fetch profile');
                const profileData = await res.json();
                setData(profileData);
                setUpdatedData(profileData);

                // Fetch cities data
                const citiesRes = await fetch('/api/cities');
                if (!citiesRes.ok) throw new Error('Failed to fetch cities');
                const citiesData = await citiesRes.json();
                setCities(citiesData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    const handleImageUpload = async (file: File) => {
        if (!userId) return;

        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`/api/upload-profile-image/${userId}`, {
                method: 'POST',
                body: formData
            });

            if (!uploadRes.ok) throw new Error('Upload failed');
            const { url } = await uploadRes.json();

            setUpdatedData(prev => prev ? { ...prev, profile_image_url: url } : null);
            setData(prev => prev ? { ...prev, profile_image_url: url } : null);

        } catch (error) {
            Modal.error({ title: 'Upload Failed', content: 'Could not update profile image' });
        } finally {
            setImageLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setUpdatedData(prev => prev ? { ...prev, [e.target.name]: e.target.value } : null);
    };

    const handleSaveChanges = async () => {
        if (!userId || !updatedData) return;

        try {
            const res = await fetch(`/api/my-profile/${userId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData)
            });

            if (!res.ok) throw new Error('Update failed');
            setData(await res.json());
            setEditing(false);
            Modal.success({ title: 'Profile Updated', content: 'Your changes have been saved' });
        } catch (error) {
            Modal.error({ title: 'Update Failed', content: 'Could not save changes' });
        }
    };

    const ProfileField = ({ label, value, name, type = "text", editable = true, cities = [] }: {
        label: string;
        value: string;
        name: string;
        type?: string;
        editable?: boolean;
        cities?: City[];
    }) => (
        <div className="space-y-1">
            <label className="text-sm font-medium text-gray-600">{label}</label>
            {editing && editable ? (
                name === "city" ? (
                    <select
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="">Select City</option>
                        {cities.map(city => (
                            <option key={city.city_id} value={city.city_id}>
                                {city.city_name}
                            </option>
                        ))}
                    </select>
                ) : (
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={!editable}
                    />
                )
            ) : (
                <p className="p-2 bg-gray-50 rounded-lg">
                    {name === "city"
                        ? cities.find(city => city.city_id === value)?.city_name || "Not provided"
                        : value || "Not provided"
                    }
                </p>
            )}
        </div>
    );

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
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    {/* Header Section */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{data.name}</h1>
                            <p className="text-gray-500">Member since {format(new Date(data.created_at), 'MMM yyyy')}</p>
                        </div>
                        <div className="flex gap-4">
                            {editing ? (
                                <>
                                    <button
                                        onClick={() => setEditing(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        className="px-4 py-2 bg-primary text-white rounded-lg  transition-all"
                                    >
                                        Save Changes
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={() => setEditing(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-all"
                                >
                                    Edit Profile
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Profile Content */}
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Profile Picture Section */}
                        <div className="md:col-span-1 flex flex-col items-center">
                            <div className="relative group">
                                <img
                                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    src={data.profile_image_url || "/placeholder.jpg"}
                                    alt={data.name}
                                />
                                {editing && (
                                    <>
                                        <input
                                            type="file"
                                            id="profileImage"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                        />
                                        <label
                                            htmlFor="profileImage"
                                            className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            {imageLoading ? (
                                                <LoadingOutlined className="text-2xl text-white" />
                                            ) : (
                                                <CameraOutlined className="text-2xl text-white" />
                                            )}
                                        </label>
                                    </>
                                )}
                            </div>
                            {editing && (
                                <p className="text-sm text-gray-500 mt-2 text-center">
                                    Click image to update
                                </p>
                            )}
                        </div>

                        {/* Profile Details */}
                        <div className="md:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <ProfileField
                                    label="Full Name"
                                    name="name"
                                    value={updatedData.name}
                                />
                                <ProfileField
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={updatedData.email}
                                    editable={false}
                                />
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-gray-600">Phone Number</label>
                                    {editing ? (
                                        <div className="flex space-x-2">
                                            <input
                                                type="text"
                                                value="+92"
                                                className="w-12 border border-gray-300 pl-2 rounded-xl py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                                disabled
                                            />
                                            <input
                                                type="text"
                                                name="phone_number"
                                                value={updatedData.phone_number}
                                                onChange={handleInputChange}
                                                placeholder="3338888666"
                                                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                            />
                                        </div>
                                    ) : (
                                        <p className="p-2 bg-gray-50 rounded-lg">
                                            +92{updatedData.phone_number}
                                        </p>
                                    )}
                                </div>
                                <ProfileField
                                    label="Date of Birth"
                                    name="dob"
                                    type="date"
                                    value={updatedData.dob}
                                />
                                <ProfileField
                                    label="City"
                                    name="city"
                                    value={updatedData.city}
                                    cities={cities}
                                />
                            </div>

                            {/* Security Section */}
                            <div className="border-t pt-6">
                                <h3 className="text-lg font-semibold mb-4">Security</h3>
                                <button
                                    onClick={() => setPasswordModalVisible(true)}
                                    className="px-4 py-2 bg-primary text-white rounded-lg transition-all"
                                >
                                    <LockOutlined /> {/* Add the LockOutlined icon here */}
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Change Modal */}
                <Modal
                    title="Change Password"
                    visible={passwordModalVisible}
                    onCancel={() => setPasswordModalVisible(false)}
                    footer={null}
                    destroyOnClose
                >
                    <Form
                        form={passwordForm}
                        layout="vertical"
                        onFinish={handlePasswordChange}
                    >
                        <Form.Item
                            label="Current Password"
                            name="currentPassword"
                            rules={[
                                { required: true, message: 'Please input your current password!' }
                            ]}
                        >
                            <Input.Password placeholder="Enter current password" />
                        </Form.Item>

                        <Form.Item
                            label="New Password"
                            name="newPassword"
                            rules={[
                                { required: true, message: 'Please input new password!' },
                                () => ({
                                    validator(_, value) {
                                        if (!value || passwordRegex.test(value)) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(
                                            new Error('Password must contain: 8+ characters, 1 uppercase, 1 lowercase, 1 number, 1 special character')
                                        );
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Enter new password" />
                        </Form.Item>

                        <Form.Item
                            label="Confirm New Password"
                            name="confirmPassword"
                            dependencies={['newPassword']}
                            rules={[
                                { required: true, message: 'Please confirm your new password!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('newPassword') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Passwords do not match!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password placeholder="Confirm new password" />
                        </Form.Item>

                        <Form.Item>
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg transition-all flex items-center justify-center gap-2"
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