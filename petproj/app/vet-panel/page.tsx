"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { CameraOutlined, LoadingOutlined, LockOutlined, PlusOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { Modal, Input, Form, message, Button } from "antd";
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

interface ClinicDetails {
    vet_id: number;
    user_id: number;
    clinic_name: string;
    location: string; // Changed from 'address'
    minimum_fee: number;
    contact_details: string; // Changed from 'contact'
    profile_verified: boolean;
    created_at: string;
    bio: string;
    clinic_whatsapp: string;
    clinic_email: string;
    applied: any;
    approved: boolean;
}

interface Qualification {
    vet_qualifications_id: number;
    vet_id: number;
    qualification_id: number;
    qualification_name: string; // Changed from 'degree'
    year_acquired: number; // Changed from 'year'
    note: string; // Changed from 'institution'
}

interface ReviewSummary {
    total_approved_reviews: number;
    total_pending_reviews: number;
    average_rating: string;
    most_recent_review_date: string;
}

interface Schedule {
    availability_id: number;
    vet_id: number;
    day_of_week: string; // Changed from 'day'
    start_time: string; // Changed from 'opening_time'
    end_time: string; // Changed from 'closing_time'
}

interface Specialization {
    vet_id: number;
    category_id: number;
    category_name: string; // Changed from 'specialization'
}

interface VetProfileData {
    clinicDetails: ClinicDetails | null;
    qualifications: Qualification[];
    reviews: ReviewSummary; // Changed from Review[]
    schedule: Schedule[];
    specializations: Specialization[];
}

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const VetProfile = () => {
    useSetPrimaryColor();

    const [vetData, setVetData] = useState<VetProfileData>({
        clinicDetails: null,
        qualifications: [],
        reviews: {
            total_approved_reviews: 0,
            total_pending_reviews: 0,
            average_rating: "0",
            most_recent_review_date: "",
        },
        schedule: [],
        specializations: [],
    });

    const [userId, setUserId] = useState<string | null>(null);
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [passwordModalVisible, setPasswordModalVisible] = useState(false);
    const [passwordForm] = Form.useForm();
    const [cities, setCities] = useState<City[]>([]);
    const [updatedVetData, setUpdatedVetData] = useState<VetProfileData>(vetData);
    const [isEditingQualification, setIsEditingQualification] = useState<number | null>(null);
    const [isEditingSpecialization, setIsEditingSpecialization] = useState<number | null>(null);
    const [isEditingSchedule, setIsEditingSchedule] = useState<number | null>(null);
    const [vetId, setVetId] = useState<string | null>(null);

    const fetchVetId = async (userId: string) => {
        try {
            const res = await fetch(`/api/get-vet-id?user_id=${userId}`);
            if (!res.ok) throw new Error('Failed to fetch vet ID');
            const data = await res.json();
            console.log('Vet ID response:', data); // Debug log
            return data.vet_id;
        } catch (error) {
            console.error("Error fetching vet ID:", error);
            throw error;
        }
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

                // Fetch vet ID
                const vetId = await fetchVetId(parsedUser.id);
                setVetId(vetId);
                console.log("Fetched vet ID:", vetId); // Debug log

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

    const [vetLoading, setVetLoading] = useState(false);

    const fetchVetData = async (vetId: string) => {
        try {
            console.log("Fetching vet data for vetId:", vetId); // Debug log
            const responses = await Promise.all([
                fetch(`/api/vet-panel/clinic-details/${vetId}`),
                fetch(`/api/vet-panel/qualifications/${vetId}`),
                fetch(`/api/vet-panel/reviews/${vetId}`),
                fetch(`/api/vet-panel/schedule/${vetId}`),
                fetch(`/api/vet-panel/specialization/${vetId}`)
            ]);

            const [clinicRes, qualificationsRes, reviewsRes, scheduleRes, specializationRes] = responses;

            if (!clinicRes.ok) throw new Error('Failed to fetch clinic details');
            if (!qualificationsRes.ok) throw new Error('Failed to fetch qualifications');
            if (!reviewsRes.ok) throw new Error('Failed to fetch reviews');
            if (!scheduleRes.ok) throw new Error('Failed to fetch schedule');
            if (!specializationRes.ok) throw new Error('Failed to fetch specializations');

            const [clinicDetails, qualifications, reviews, schedule, specializations] = await Promise.all([
                clinicRes.json(),
                qualificationsRes.json(),
                reviewsRes.json(),
                scheduleRes.json(),
                specializationRes.json()
            ]);

            console.log('Vet Data:', {
                clinicDetails,
                qualifications,
                reviews,
                schedule,
                specializations
            }); // Add 

            setVetData({
                clinicDetails,
                qualifications,
                reviews,
                schedule,
                specializations,
            });

        } catch (error) {
            console.error("Error fetching vet data:", error);
            message.error("Failed to load some vet profile data");
        } finally {
            setVetLoading(false);
        }
    };

    useEffect(() => {
        setUpdatedVetData(vetData);
    }, [vetData]);

    useEffect(() => {
        if (vetId) {  // Changed from userId to vetId
            console.log("Vet ID available, fetching vet data"); // Debug log
            fetchVetData(vetId);
        }
    }, [vetId]);

    const handleImageUpload = async (file: File) => {
        if (!userId) return;

        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);

            const uploadRes = await fetch(`/api/update-profile-image/${userId}`, {
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
        const { name, value } = e.target;
        setUpdatedData((prev) => prev ? { ...prev, [name]: value } : null);
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

            const result = await res.json();
            setData(result.user);
            setUpdatedData(result.user);
            setEditing(false);

            message.success({
                content: 'Profile updated successfully',
                duration: 3,
            });
        } catch (error) {
            message.error({
                content: 'Failed to update profile',
                duration: 3,
            });
        }
    };

    const handleCancel = () => {
        setUpdatedData(data);
        setEditing(false);
    };

    const handleSaveVetChanges = async () => {
        if (!vetId) {  // Changed from userId to vetId
            console.error('No vetId available for saving');
            message.error("Vet profile not available for saving");
            return;
        }

        try {
            // Save clinic details if changed
            if (updatedVetData.clinicDetails) {
                const res = await fetch(`/api/vet-panel/clinic-details/${vetId}`, {  // Changed to vetId
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedVetData.clinicDetails)
                });
                if (!res.ok) throw new Error('Failed to update clinic details');
            }

            // Save qualifications
            const qualificationsRes = await fetch(`/api/vet-panel/qualifications/${vetId}`, {  // Changed to vetId
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedVetData.qualifications)
            });
            if (!qualificationsRes.ok) throw new Error('Failed to update qualifications');

            // Save schedule
            const scheduleRes = await fetch(`/api/vet-panel/schedule/${vetId}`, {  // Changed to vetId
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedVetData.schedule)
            });
            if (!scheduleRes.ok) throw new Error('Failed to update schedule');

            // Save specializations
            const specializationsRes = await fetch(`/api/vet-panel/specialization/${vetId}`, {  // Changed to vetId
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedVetData.specializations)
            });
            if (!specializationsRes.ok) throw new Error('Failed to update specializations');

            message.success("Vet profile updated successfully");
            setEditing(false);
            fetchVetData(vetId);  // Changed to vetId
        } catch (error) {
            console.error('Error saving vet data:', error);
            message.error(error instanceof Error ? error.message : "Failed to update vet profile");
        }
    };

    // Handle adding/editing qualifications
    const handleQualificationChange = (index: number, field: keyof Qualification, value: string) => {
        const updatedQualifications = [...updatedVetData.qualifications];
        updatedQualifications[index] = {
            ...updatedQualifications[index],
            [field]: field === "year_acquired" ? parseInt(value) || 0 : value
        };
        setUpdatedVetData({ ...updatedVetData, qualifications: updatedQualifications });
    };

    const addNewQualification = () => {
        setUpdatedVetData({
            ...updatedVetData,
            qualifications: [
                ...updatedVetData.qualifications,
                { vet_qualifications_id: 0, vet_id: 0, qualification_id: 0, qualification_name: '', note: '', year_acquired: new Date().getFullYear() }
            ]
        });
        setIsEditingQualification(updatedVetData.qualifications.length);
    };

    // Handle adding/editing specializations
    const handleSpecializationChange = (index: number, value: string) => {
        const updatedSpecializations = [...updatedVetData.specializations];
        updatedSpecializations[index] = { ...updatedSpecializations[index], category_name: value };
        setUpdatedVetData({ ...updatedVetData, specializations: updatedSpecializations });
    };

    const addNewSpecialization = () => {
        setUpdatedVetData({
            ...updatedVetData,
            specializations: [
                ...updatedVetData.specializations,
                { vet_id: 0, category_id: 0, category_name: '' }
            ]
        });
        setIsEditingSpecialization(updatedVetData.specializations.length);
    };

    const addNewScheduleSlot = () => {
        setUpdatedVetData({
            ...updatedVetData,
            schedule: [
                ...updatedVetData.schedule,
                { availability_id: 0, vet_id: 0, day_of_week: 'Monday', start_time: '09:00', end_time: '17:00' }
            ]
        });
        setIsEditingSchedule(updatedVetData.schedule.length);
    };

    // Handle adding/editing schedule
    const handleScheduleChange = (index: number, field: keyof Schedule, value: string) => {
        const updatedSchedule = [...updatedVetData.schedule];
        updatedSchedule[index] = {
            ...updatedSchedule[index],
            [field]: value
        };
        setUpdatedVetData({ ...updatedVetData, schedule: updatedSchedule });
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
                        value={value || ""}
                        onChange={handleInputChange}
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
                    <input
                        type={type}
                        name={name}
                        value={value || ""}
                        onChange={handleInputChange}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        disabled={!editable}
                    />
                )
            ) : (
                <p className="p-2 bg-gray-50 rounded-lg">
                    {name === "city"
                        ? cities.find(city => city.city_name === value)?.city_name || value || "Not provided"
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

    const ProfileSection = ({
        title,
        children,
        editable,
        onAdd,
        onSave,
        onCancel
    }: {
        title: string;
        children: React.ReactNode;
        editable?: boolean;
        onAdd?: () => void;
        onSave?: () => void;
        onCancel?: () => void;
    }) => (
        <div className="">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">{title}</h3>
                {editing && (
                    <div className="flex gap-2">
                        {onAdd && (
                            <Button
                                onClick={onAdd}
                                icon={<PlusOutlined />}
                                type="text"
                                className="text-primary"
                            >
                                Add
                            </Button>
                        )}
                    </div>
                )}
            </div>
            {children}
            {editing && (onSave || onCancel) && (
                <div className="flex justify-end gap-2 mt-4">
                    {onCancel && (
                        <Button onClick={onCancel}>
                            Cancel
                        </Button>
                    )}
                    {onSave && (
                        <Button
                            type="primary"
                            onClick={onSave}
                            className="bg-primary"
                        >
                            Save
                        </Button>
                    )}
                </div>
            )}
        </div>
    );

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
                        <div className="md:col-span-2 space-y-6 mt-3">
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
                                    value={new Date(updatedData.dob).toLocaleDateString()}
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

                <div className="bg-white rounded-xl shadow-lg p-6 mt-3">
                    {/* Clinic Details Section */}
                    <ProfileSection
                        title="Clinic Details"
                        editable={editing}
                        onSave={handleSaveVetChanges}  // Add this
                        onCancel={() => setEditing(false)}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <ProfileField
                                label="Clinic Name"
                                name="clinicName"
                                value={vetData.clinicDetails?.clinic_name || "Not provided"}
                                editable={editing}
                            />
                            <ProfileField
                                label="Address"
                                name="address"
                                value={vetData.clinicDetails?.location || "Not provided"}
                                editable={editing}
                            />
                            <ProfileField
                                label="Contact"
                                name="clinicContact"
                                value={vetData.clinicDetails?.contact_details || "Not provided"}
                                editable={editing}
                            />
                        </div>
                    </ProfileSection>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6 mt-3">
                    {/* Qualifications Section */}
                    <ProfileSection
                        title="Qualifications"
                        editable={editing}
                        onAdd={() => {/* Add qualification logic */ }}
                    >
                        {vetData.qualifications.length === 0 ? (
                            <p className="text-gray-500">No qualifications added</p>
                        ) : (
                            <div className="space-y-4">
                                {vetData.qualifications.map((qualification, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <ProfileField
                                            label="Degree"
                                            name={`qualifications[${index}].degree`}
                                            value={qualification.qualification_name}
                                            editable={editing}
                                        />
                                        <ProfileField
                                            label="Institution"
                                            name={`qualifications[${index}].institution`}
                                            value={qualification.note}
                                            editable={editing}
                                        />
                                        <ProfileField
                                            label="Year"
                                            name={`qualifications[${index}].year`}
                                            value={qualification.year_acquired.toString()}
                                            editable={editing}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </ProfileSection>
                </div>


                <div className="bg-white rounded-xl shadow-lg p-6  mt-3">
                    {/* Specializations Section */}
                    <ProfileSection
                        title="Specializations"
                        editable={editing}
                        onAdd={() => {/* Add specialization logic */ }}
                    >
                        {vetData.specializations.length === 0 ? (
                            <p className="text-gray-500">No specializations added</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {vetData.specializations.map((spec, index) => (
                                    <div key={index} className="bg-primary/10 px-3 py-1 rounded-full">
                                        {editing ? (
                                            <input
                                                value={spec.category_name}
                                                onChange={(e) => {/* Update specialization */ }}
                                                className="bg-transparent focus:outline-none"
                                            />
                                        ) : (
                                            <span className="text-primary">{spec.category_name}</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </ProfileSection>
                </div>


                <div className="bg-white rounded-xl shadow-lg p-6  mt-3">
                    {/* Schedule Section */}
                    <ProfileSection title="Schedule" editable={editing}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vetData.schedule.map((slot, index) => (
                                <div key={index} className="border rounded-lg p-4">
                                    <ProfileField
                                        label="Day"
                                        name={`schedule[${index}].day`}
                                        value={slot.day_of_week}
                                        editable={editing}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <ProfileField
                                            label="Opening Time"
                                            name={`schedule[${index}].opening_time`}
                                            value={slot.start_time}
                                            type="time"
                                            editable={editing}
                                        />
                                        <ProfileField
                                            label="Closing Time"
                                            name={`schedule[${index}].closing_time`}
                                            value={slot.end_time}
                                            type="time"
                                            editable={editing}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ProfileSection>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6  mt-3">
                    {/* Reviews Section */}
                    <ProfileSection title="Reviews">
                        {vetData.reviews.total_approved_reviews === 0 ? (
                            <p className="text-gray-500">No reviews yet</p>
                        ) : (
                            <div className="space-y-4">
                                <div className="border rounded-lg p-4">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium">Total Approved Reviews</span>
                                        <span>{vetData.reviews.total_approved_reviews}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium">Total Pending Reviews</span>
                                        <span>{vetData.reviews.total_pending_reviews}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium">Average Rating</span>
                                        <span>{vetData.reviews.average_rating}</span>
                                    </div>
                                    <div className="flex justify-between mb-2">
                                        <span className="font-medium">Most Recent Review Date</span>
                                        <span>
                                            {vetData.reviews.most_recent_review_date
                                                ? new Date(vetData.reviews.most_recent_review_date).toLocaleDateString()
                                                : "N/A"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </ProfileSection>
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

export default VetProfile;