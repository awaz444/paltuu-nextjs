"use client";
import React, { useState, useEffect } from "react";
import { CameraOutlined, LoadingOutlined, LockOutlined } from "@ant-design/icons";
import { Modal, Input, Form, message, Button, Select } from "antd";
import { format } from "date-fns";

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

const VetProfileTab = () => {
    const [data, setData] = useState<UserProfileData | null>(null);
    const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
    const [editing, setEditing] = useState(false);
    const [imageLoading, setImageLoading] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [cities, setCities] = useState<City[]>([]);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            setUserId(parsedUser.id);
            try {
                // Fetch user profile data
                const res = await fetch(`/api/v1/profile`, { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch profile');
                const profileData = await res.json();
                setData(profileData);
                setUpdatedData(profileData);

                // Fetch cities data
                const citiesRes = await fetch('/api/v1/cities', { credentials: 'include' });
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
                credentials: 'include',
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

    const handleImageUpload = async (file: File) => {
        if (!userId) return;

        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`/api/v1/profile/avatar`, {
                method: 'POST',
                credentials: 'include',
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

    const handlePersonalInfoChange = (field: keyof UserProfileData, value: string) => {
        setUpdatedData(prev => prev ? {
            ...prev,
            [field]: value
        } : null);
    };

    const handleSaveChanges = async () => {
        if (!userId) {
            message.error("Profile not available for saving");
            return;
        }

        try {
            // Save personal info if changed
            if (updatedData) {
                const res = await fetch(`/api/v1/profile`, {
                    method: "PATCH",
                    credentials: 'include',
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData)
                });
                if (!res.ok) throw new Error('Failed to update profile');
                const result = await res.json();
                setData(result.user);
                setUpdatedData(result.user);
            }

            message.success("Profile updated successfully");
            setEditing(false);
        } catch (error) {
            console.error('Error saving changes:', error);
            message.error(error instanceof Error ? error.message : "Failed to update profile");
        }
    };

    const handleCancel = () => {
        setUpdatedData(data);
        setEditing(false);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <LoadingOutlined className="text-4xl text-primary animate-spin" />
            </div>
        );
    }

    if (!data || !updatedData) {
        return (
            <div className="flex justify-center items-center h-64">
                <p className="text-red-500">Failed to load profile data</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Personal Information</h2>
                {editing ? (
                    <div className="flex gap-2">
                        <button
                            onClick={handleCancel}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveChanges}
                            className="px-4 py-2 bg-primary text-white rounded-lg transition-all"
                        >
                            Save Changes
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={() => setEditing(true)}
                        className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-all"
                    >
                        Edit Profile
                    </button>
                )}
            </div>

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
                <div className="md:col-span-2 space-y-6 mt-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Full Name */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Full Name</label>
                            {editing ? (
                                <input
                                    type="text"
                                    value={updatedData?.name || ""}
                                    onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            ) : (
                                <p className="p-2 bg-gray-50 rounded-lg">
                                    {updatedData?.name || "Not provided"}
                                </p>
                            )}
                        </div>
                        
                        {/* Email */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Email Address</label>
                            <p className="p-2 bg-gray-50 rounded-lg">
                                {updatedData?.email || "Not provided"}
                            </p>
                        </div>
                        
                        {/* Phone Number */}
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
                                        value={updatedData?.phone_number || ""}
                                        onChange={(e) => handlePersonalInfoChange('phone_number', e.target.value)}
                                        placeholder="3338888666"
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                    />
                                </div>
                            ) : (
                                <p className="p-2 bg-gray-50 rounded-lg">
                                    +92{updatedData?.phone_number || "Not provided"}
                                </p>
                            )}
                        </div>
                        
                        {/* Date of Birth */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                            {editing ? (
                                <input
                                    type="date"
                                    value={updatedData?.dob ? new Date(updatedData.dob).toISOString().split('T')[0] : ""}
                                    onChange={(e) => handlePersonalInfoChange('dob', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                />
                            ) : (
                                <p className="p-2 bg-gray-50 rounded-lg">
                                    {updatedData?.dob ? format(new Date(updatedData.dob), 'MMM dd, yyyy') : "Not provided"}
                                </p>
                            )}
                        </div>

                        {/* City */}
                        <div className="space-y-1">
                            <label className="text-sm font-medium text-gray-600">City</label>
                            {editing ? (
                                <select
                                    value={updatedData?.city || ""}
                                    onChange={(e) => handlePersonalInfoChange('city', e.target.value)}
                                    className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Select City</option>
                                    {cities.map(city => (
                                        <option key={city.city_id} value={city.city_name}>
                                            {city.city_name}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <p className="p-2 bg-gray-50 rounded-lg">
                                    {updatedData?.city || "Not provided"}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">Security</h3>
                        <button
                            onClick={() => setPasswordModalVisible(true)}
                            className="px-4 py-2 bg-primary text-white rounded-lg transition-all flex items-center gap-2"
                        >
                            <LockOutlined />
                            Change Password
                        </button>
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
    );
};

export default VetProfileTab;