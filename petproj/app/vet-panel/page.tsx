"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { CameraOutlined, LoadingOutlined, LockOutlined, PlusOutlined } from "@ant-design/icons";
import { format } from "date-fns";
import { Modal, Input, Form, message, Button, Select } from "antd";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
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
    qualification_id?: number;
    qualification_name: string; // Changed from 'degree'
    year_acquired: number; // Changed from 'year'
    note: string; // Changed from 'institution'
    status: string;
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

interface PetCategory {
    category_id: number;
    category_name: string;
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
    const [vetId, setVetId] = useState<string | null>(null);
    const [submittingQualification, setSubmittingQualification] = useState(false);
    const [submittingSpecialization, setSubmittingSpecialization] = useState(false);
    const [submittingSchedule, setSubmittingSchedule] = useState(false);
    const [deleting, setDeleting] = useState<{
        qualifications: number | null;
        specializations: number | null;
        schedule: number | null;
    }>({ qualifications: null, specializations: null, schedule: null });
    const [petCategories, setPetCategories] = useState<PetCategory[]>([]);
    const [qualificationModalVisible, setQualificationModalVisible] = useState(false);
    const [specializationModalVisible, setSpecializationModalVisible] = useState(false);
    const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
    const [qualificationForm] = Form.useForm();
    const [specializationForm] = Form.useForm();
    const [scheduleForm] = Form.useForm();
    const [qualifications, setQualifications] = useState<Array<{
        qualification_id: number;
        qualification_name: string;
    }>>([]);
    const editableClinicFields = [
        'clinic_name',
        'location',
        'contact_details',
        'minimum_fee',
        'clinic_whatsapp',
        'clinic_email'
    ] as const;

    // 2. Your existing type
    type EditableClinicFields = typeof editableClinicFields[number];

    // 3. Add this type guard (uses your existing EditableClinicFields)
    function isEditableField(field: keyof ClinicDetails): field is EditableClinicFields {
        return editableClinicFields.includes(field as any);
    }
    // Refs for each input to maintain focus
    const inputIds = {
        clinic_name: `clinic-name-${Math.random().toString(36).substr(2, 9)}`,
        location: `location-${Math.random().toString(36).substr(2, 9)}`,
        contact_details: `contact-${Math.random().toString(36).substr(2, 9)}`,
        minimum_fee: `fee-${Math.random().toString(36).substr(2, 9)}`,
        clinic_whatsapp: `whatsapp-${Math.random().toString(36).substr(2, 9)}`,
        clinic_email: `email-${Math.random().toString(36).substr(2, 9)}`
    } as const;
    const [clinicForm, setClinicForm] = useState<Partial<ClinicDetails>>({});
    const getInputId = (field: keyof ClinicDetails): string => {
        return isEditableField(field) ? inputIds[field] : '';
    };

    // Initialize form when data loads
    useEffect(() => {
        if (updatedVetData.clinicDetails) {
            setClinicForm(updatedVetData.clinicDetails);
        }
    }, [updatedVetData.clinicDetails]);

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

                const categoriesRes = await fetch('/api/pet-categories');
                if (!categoriesRes.ok) throw new Error('Failed to fetch pet categories');
                const categoriesData = await categoriesRes.json();
                setPetCategories(categoriesData);
            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadUserData();
    }, []);

    const [vetLoading, setVetLoading] = useState(false);

    const fetchVetData = async (vetId: string | null) => {
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
    const handlePersonalInfoChange = (field: keyof UserProfileData, value: string) => {
        setUpdatedData(prev => prev ? {
            ...prev,
            [field]: value
        } : null);
    };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Handle personal info updates
        if (name in (updatedData || {})) {
            setUpdatedData(prev => prev ? { ...prev, [name]: value } : null);
        }
        // Handle vet info updates
        else if (name in (updatedVetData.clinicDetails || {})) {
            handleClinicChange(name as keyof ClinicDetails, value);
        }
    };
    useEffect(() => {
        if (editing && updatedVetData.clinicDetails) {
            setClinicForm(updatedVetData.clinicDetails);
        }
    }, [editing, updatedVetData.clinicDetails]);

    const handleSaveChanges = async () => {
        const id = userId || vetId;
        if (!id) {
            message.error("Profile not available for saving");
            return;
        }

        try {
            // Save personal info if changed
            if (updatedData) {
                const res = await fetch(`/api/my-profile/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData)
                });
                if (!res.ok) throw new Error('Failed to update profile');
                const result = await res.json();
                setData(result.user);
                setUpdatedData(result.user);
            }

            // Save vet info if changed
            if (vetId && updatedVetData) {
                // Save clinic details
                // Ensure clinicDetails includes the latest form data before saving
                const clinicDetailsToSave = {
                    ...updatedVetData.clinicDetails,
                    ...clinicForm
                };

                // Save clinic details
                if (clinicDetailsToSave) {
                    const clinicRes = await fetch(`/api/vet-panel/clinic-details/${vetId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(clinicDetailsToSave)
                    });

                    if (!clinicRes.ok) {
                        const errorData = await clinicRes.json();
                        throw new Error(errorData.message || 'Failed to update clinic details');
                    }
                }
                // Save qualifications (only updates, additions are handled separately)
                const qualRes = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        qualifications: updatedVetData.qualifications
                            .filter(q => q.vet_qualifications_id !== 0) // Only existing qualifications
                            .map(q => ({
                                qualification_id: q.qualification_id,
                                year_acquired: q.year_acquired,
                                note: q.note
                            }))
                    })
                });
                if (!qualRes.ok) throw new Error('Failed to update qualifications');

                // Save schedule (only updates, additions are handled separately)
                const schedRes = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        availability: updatedVetData.schedule
                            .filter(s => s.availability_id !== 0) // Only existing schedules
                            .map(s => ({
                                availability_id: s.availability_id,
                                day_of_week: s.day_of_week,
                                start_time: s.start_time,
                                end_time: s.end_time
                            }))
                    })
                });
                if (!schedRes.ok) throw new Error('Failed to update schedule');
            }

            message.success("Profile updated successfully");
            setEditing(false);
            fetchVetData(vetId); // Refresh the data after successful update
        } catch (error) {
            console.error('Error saving changes:', error);
            message.error(error instanceof Error ? error.message : "Failed to update profile");
        }
    };

    const handleCancel = () => {
        setUpdatedData(data);
        setEditing(false);
    };


    const handleAddSpecialization = async (categoryId: number) => {
        if (!vetId) return;

        try {
            const res = await fetch(`/api/vet-panel/specialization/${vetId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: categoryId })
            });

            if (!res.ok) throw new Error('Failed to add specialization');
            const newSpecialization = await res.json();
            return newSpecialization;
        } catch (error) {
            console.error("Error adding specialization:", error);
            throw error;
        }
    };

    const handleScheduleSubmit = async () => {
        if (submittingSchedule || !vetId) return;
        setSubmittingSchedule(true);

        try {
            const values = await scheduleForm.validateFields();

            // 1. Prepare ONLY the slots array (no vet_id in body!)
            const slots = [{
                day_of_week: values.day_of_week,
                start_time: values.start_time.endsWith(':00')
                    ? values.start_time.slice(0, -3) // Remove ":00" if present
                    : values.start_time,
                end_time: values.end_time.endsWith(':00')
                    ? values.end_time.slice(0, -3)
                    : values.end_time
            }];

            console.log('Sending:', { slots }); // Verify before sending

            // 2. Send to endpoint with vet_id in URL
            const response = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") && {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    })
                },
                body: JSON.stringify(slots) // Send ONLY the array
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add slot");
            }

            // Success
            message.success("Slot added!");
            setScheduleModalVisible(false);
            scheduleForm.resetFields();
            await fetchVetData(vetId);

        } catch (error) {
            console.error("Error:", error);
            message.error({ content: "Failed to add slot" });
        } finally {
            setSubmittingSchedule(false);
        }
    };

    const handleQualificationSubmit = async () => {
        if (submittingQualification) return;
        setSubmittingQualification(true);

        try {
            const values = await qualificationForm.validateFields();

            const response = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(localStorage.getItem("token") && {
                        Authorization: `Bearer ${localStorage.getItem("token")}`
                    })
                },
                body: JSON.stringify({
                    qualification_id: values.qualification_id,
                    year_acquired: values.year_acquired,
                    note: values.note || null
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Failed to add qualification");
            }

            message.success("Qualification added successfully!");
            setQualificationModalVisible(false);
            qualificationForm.resetFields();
            await fetchVetData(vetId);
        } catch (error) {
            message.error({ content: "Failed to add qualification" });
        } finally {
            setSubmittingQualification(false);
        }
    };

    const handleSpecializationSubmit = async () => {
        if (submittingSpecialization) return;
        setSubmittingSpecialization(true);

        try {
            const values = await specializationForm.validateFields();
            message.loading({ content: 'Adding specialization...', key: 'spec' });

            await handleAddSpecialization(values.category_id);

            setSpecializationModalVisible(false);
            specializationForm.resetFields();
            await fetchVetData(vetId);

            message.success({
                content: "Specialization added successfully",
                key: 'spec',
                duration: 3
            });
        } catch (error) {
            console.error("Submission error:", error);
            message.error({ content: "Failed to add specialization" });
        } finally {
            setSubmittingSpecialization(false);
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


    // Handle adding/editing specializations
    const handleSpecializationChange = (index: number, value: string) => {
        const updatedSpecializations = [...updatedVetData.specializations];
        updatedSpecializations[index] = { ...updatedSpecializations[index], category_name: value };
        setUpdatedVetData({ ...updatedVetData, specializations: updatedSpecializations });
    };


    const showQualificationModal = () => {
        qualificationForm.resetFields();
        setQualificationModalVisible(true);
    };

    const showSpecializationModal = () => {
        specializationForm.resetFields();
        setSpecializationModalVisible(true);
    };

    const showScheduleModal = () => {
        scheduleForm.resetFields();
        setScheduleModalVisible(true);
    };

    //delete functions
    const deleteQualification = async (vetId: string, qualificationId: number) => {
        setDeleting(prev => ({ ...prev, qualifications: qualificationId }));
        try {
            const res = await fetch(`/api/vet-panel/qualifications/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ qualification_id: qualificationId })
            });
            if (!res.ok) throw new Error('Failed to delete qualification');
            return true;
        } catch (error) {
            console.error("Error deleting qualification:", error);
            return false;
        } finally {
            setDeleting(prev => ({ ...prev, qualifications: null }));
        }
    };


    const deleteSpecialization = async (vetId: string, categoryId: number) => {
        setDeleting(prev => ({ ...prev, specializations: categoryId }));
        try {
            const res = await fetch(`/api/vet-panel/specialization/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ category_id: categoryId })
            });
            if (!res.ok) throw new Error('Failed to delete specialization');
            return true;
        } catch (error) {
            console.error("Error deleting specialization:", error);
            message.error("Failed to delete specialization");
            return false;
        } finally {
            setDeleting(prev => ({ ...prev, specializations: null }));
        }
    };

    const deleteScheduleSlot = async (vetId: string, availabilityId: number) => {
        setDeleting(prev => ({ ...prev, schedule: availabilityId }));
        try {
            const res = await fetch(`/api/vet-panel/schedule/${vetId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ availability_id: availabilityId })
            });
            if (!res.ok) throw new Error('Failed to delete schedule slot');
            return true;
        } catch (error) {
            console.error("Error deleting schedule slot:", error);
            message.error("Failed to delete schedule slot");
            return false;
        } finally {
            setDeleting(prev => ({ ...prev, schedule: null }));
        }
    };

    // Handle adding/editing schedule
    const handleScheduleChange = (availability_id: number, field: keyof Schedule, value: string) => {
        const updatedSchedule = updatedVetData.schedule.map((slot) =>
            slot.availability_id === availability_id ? { ...slot, [field]: value } : slot
        );

        setUpdatedVetData({ ...updatedVetData, schedule: updatedSchedule });
    };

    const handleClinicChange = useCallback((field: keyof ClinicDetails, value: string | number) => {
        setClinicForm(prev => {
            const newForm = { ...prev, [field]: value };

            // Also update the updatedVetData to keep everything in sync
            setUpdatedVetData(prev => ({
                ...prev,
                clinicDetails: {
                    ...prev.clinicDetails,
                    ...newForm
                } as ClinicDetails
            }));

            return newForm;
        });
    }, []);

    interface ProfileFieldProps {
        label: string;
        name: string;
        value: string;
        type?: string;
        editable?: boolean;
        cities?: City[];
        onChange?: (name: string, value: string) => void; // Modified to include field name
    }

    const ProfileField: React.FC<ProfileFieldProps> = ({
        label,
        name,
        value,
        type = "text",
        editable = true,
        cities = [],
        onChange
    }) => {
        const handleChange = (newValue: string) => {
            onChange?.(name, newValue); // Pass both field name and value
        };

        return (
            <div className="space-y-1">
                <label className="text-sm font-medium text-gray-600">{label}</label>
                {editing && editable ? (
                    name === "city" ? (
                        <select
                            value={value || ""}
                            onChange={(e) => handleChange(e.target.value)}
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
                            value={value || ""}
                            onChange={(e) => handleChange(e.target.value)}
                            className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                    )
                ) : (
                    <p className="p-2 bg-gray-50 rounded-lg">
                        {value || "Not provided"}
                    </p>
                )}
            </div>
        );
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
                {editable && (
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
            {editable && (onSave || onCancel) && (
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
    const renderField = (
        field: keyof ClinicDetails,
        label: string,
        type: string = 'text',
        format?: (value: any) => string
    ) => {
        const validField = editableClinicFields.includes(field as EditableClinicFields)
            ? field as EditableClinicFields
            : null;

        return (
            <div className="space-y-1">
                <label htmlFor={validField ? inputIds[validField] : ''} className="text-sm font-medium text-gray-600">
                    {label}
                </label>
                {editing ? (
                    validField && (
                        <input
                            id={inputIds[validField]}
                            type={type}
                            value={clinicForm[validField] || ''}
                            onChange={(e) => {
                                if (field === 'minimum_fee') {
                                    const value = parseFloat(e.target.value);
                                    // Only update if value is positive or empty
                                    if (!isNaN(value) && value >= 0 || e.target.value === '') {
                                        handleClinicChange(
                                            validField,
                                            type === 'number' ? value : e.target.value
                                        );
                                    }
                                } else {
                                    handleClinicChange(
                                        validField,
                                        type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                    );
                                }
                            }}
                            min={field === 'minimum_fee' ? "0" : undefined}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary transition-colors duration-200"
                        />
                    )
                ) : (
                    <p className="p-2 bg-gray-50 rounded-lg">
                        {format ? format(clinicForm[field]) : clinicForm[field] || "Not provided"}
                    </p>
                )}
            </div>
        );
    };

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
                                <ProfileField
                                    label="Email Address"
                                    name="email"
                                    type="email"
                                    value={updatedData?.email || ""}
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
                    {/* Simple header without action buttons */}
                    <h3 className="text-lg font-semibold mb-4">Clinic Information</h3>

                    {/* Clinic fields - will be controlled by the main edit/save buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderField('clinic_name', 'Clinic Name')}
                        {renderField('location', 'Location')}
                        {renderField('contact_details', 'Contact Number')}
                        {renderField('minimum_fee', 'Minimum Fee', 'number', (value) => `Rs. ${value || '0'}`)}
                        {renderField('clinic_whatsapp', 'WhatsApp Number')}
                        {renderField('clinic_email', 'Clinic Email', 'email')}
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 mt-3">
                    {/* Qualifications Section */}
                    <ProfileSection title="Qualifications" editable={editing} onAdd={showQualificationModal}>
                        {updatedVetData.qualifications.filter(q => q.status === 'approved').length === 0 ? (
                            <p className="text-gray-500">
                                {editing ? "No approved qualifications yet" : "No qualifications to display"}
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {updatedVetData.qualifications
                                    .filter(q => q.status === 'approved')
                                    .map((qualification, index) => (
                                        <div key={index} className="border rounded-lg p-4 relative">
                                            {/* Delete button */}
                                            {editing && (
                                                <button
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        if (vetId && qualification.qualification_id) {
                                                            const success = await deleteQualification(vetId, qualification.qualification_id);
                                                            if (success) {
                                                                const updated = [...updatedVetData.qualifications];
                                                                updated.splice(index, 1);
                                                                setUpdatedVetData({ ...updatedVetData, qualifications: updated });
                                                                message.success("Qualification deleted successfully");
                                                            }
                                                        }
                                                    }}
                                                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                                    title="Delete qualification"
                                                    disabled={deleting.qualifications === qualification.qualification_id}
                                                >
                                                    {deleting.qualifications === qualification.qualification_id ? (
                                                        <LoadingOutlined className="text-red-500" />
                                                    ) : (
                                                        '×'
                                                    )}
                                                </button>
                                            )}

                                            <span className="absolute top-2 right-10 bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                Approved
                                            </span>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Degree</label>
                                                    {editing ? (
                                                        <input
                                                            type="text"
                                                            value={qualification.qualification_name}
                                                            onChange={(e) => handleQualificationChange(index, "qualification_name", e.target.value)}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        />
                                                    ) : (
                                                        <p className="mt-1 text-gray-900">{qualification.qualification_name}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Institution</label>
                                                    {editing ? (
                                                        <input
                                                            type="text"
                                                            value={qualification.note}
                                                            onChange={(e) => handleQualificationChange(index, "note", e.target.value)}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                        />
                                                    ) : (
                                                        <p className="mt-1 text-gray-900">{qualification.note}</p>
                                                    )}
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Year</label>
                                                    {editing ? (
                                                        <input
                                                            type="number"
                                                            value={qualification.year_acquired}
                                                            onChange={(e) => handleQualificationChange(index, "year_acquired", e.target.value)}
                                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                            min="1900"
                                                            max={new Date().getFullYear()}
                                                        />
                                                    ) : (
                                                        <p className="mt-1 text-gray-900">{qualification.year_acquired}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </ProfileSection>
                </div>


                <div className="bg-white rounded-xl shadow-lg p-6  mt-3">
                    {/* Specializations Section */}
                    <ProfileSection title="Specializations" editable={editing} onAdd={showSpecializationModal}>                        {updatedVetData.specializations.length === 0 ? (
                        <p className="text-gray-500">No specializations added</p>
                    ) : (
                        <div className="flex flex-wrap gap-2">
                            {updatedVetData.specializations.map((spec, index) => (
                                <div key={index} className="bg-primary/10 px-3 py-1 rounded-full relative"> {/* Existing div */}
                                    {/* ADD DELETE BUTTON HERE */}
                                    {editing && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (vetId && spec.category_id) {
                                                    const success = await deleteSpecialization(vetId, spec.category_id);
                                                    if (success) {
                                                        const updated = [...updatedVetData.specializations];
                                                        updated.splice(index, 1);
                                                        setUpdatedVetData({ ...updatedVetData, specializations: updated });
                                                        message.success("Specialization deleted successfully");
                                                    }
                                                }
                                            }}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center hover:bg-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                            title="Delete specialization"
                                            disabled={deleting.specializations === spec.category_id}
                                        >
                                            {deleting.specializations === spec.category_id ? (
                                                <LoadingOutlined className="text-white text-xs" />
                                            ) : (
                                                '×'
                                            )}
                                        </button>
                                    )}
                                    {editing ? (
                                        <input
                                            value={spec.category_name}
                                            onChange={(e) => handleSpecializationChange(index, e.target.value)}
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
                    <ProfileSection title="Schedule" editable={editing} onAdd={showScheduleModal}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {updatedVetData.schedule.map((slot) => (
                                <div key={slot.availability_id} className="border rounded-lg p-4 relative"> {/* Existing div */}
                                    {/* ADD DELETE BUTTON HERE */}
                                    {editing && (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if (vetId && slot.availability_id) {
                                                    const success = await deleteScheduleSlot(vetId, slot.availability_id);
                                                    if (success) {
                                                        const updated = updatedVetData.schedule.filter(
                                                            s => s.availability_id !== slot.availability_id
                                                        );
                                                        setUpdatedVetData({ ...updatedVetData, schedule: updated });
                                                        message.success("Schedule slot deleted successfully");
                                                    }
                                                }
                                            }}
                                            className="absolute top-2 right-2 text-red-500 hover:text-red-700 transition-all duration-200 ease-in-out hover:scale-125"
                                            title="Delete schedule slot"
                                            disabled={deleting.schedule === slot.availability_id}
                                        >
                                            {deleting.schedule === slot.availability_id ? (
                                                <LoadingOutlined className="text-red-500" />
                                            ) : (
                                                '×'
                                            )}
                                        </button>
                                    )}
                                    <label className="block text-sm font-medium text-gray-700">Day</label>
                                    {editing ? (
                                        <select
                                            value={slot.day_of_week}
                                            onChange={(e) => handleScheduleChange(slot.availability_id, "day_of_week", e.target.value)}
                                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                        >
                                            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                                <option key={day} value={day}>{day}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="mt-1 text-gray-900">{slot.day_of_week}</p>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Opening Time</label>
                                            {editing ? (
                                                <input
                                                    type="time"
                                                    value={slot.start_time}
                                                    onChange={(e) => handleScheduleChange(slot.availability_id, "start_time", e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                />
                                            ) : (
                                                <p className="mt-1 text-gray-900">{slot.start_time}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Closing Time</label>
                                            {editing ? (
                                                <input
                                                    type="time"
                                                    value={slot.end_time}
                                                    onChange={(e) => handleScheduleChange(slot.availability_id, "end_time", e.target.value)}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                                                />
                                            ) : (
                                                <p className="mt-1 text-gray-900">{slot.end_time}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ProfileSection>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 mt-3">
                    {/* Reviews Section */}
                    <ProfileSection title="Reviews">
                        {vetData.reviews.total_approved_reviews === 0 ? (
                            <p className="text-gray-500">No reviews yet</p>
                        ) : (
                            <Link href="/vet-reviews-summary" className="block">

                                <div className="space-y-4 cursor-pointer hover:bg-gray-100 p-4 rounded-lg transition">
                                    <div className="flex justify-between items-center mb-2 text-primary">
                                        <span className="font-medium">Manage Reviews </span>
                                        <FaArrowRight className="w-4 h-4" /> {/* Right Arrow */}
                                    </div>
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
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-medium">Most Recent Review Date</span>
                                            <span className="flex items-center gap-2">
                                                {vetData.reviews.most_recent_review_date
                                                    ? new Date(vetData.reviews.most_recent_review_date).toLocaleDateString()
                                                    : "N/A"}
                                            </span>
                                        </div>

                                    </div>
                                </div>

                            </Link>
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
                {/* Qualification Modal */}
                <Modal
                    title="Add Qualification"
                    visible={qualificationModalVisible}
                    onCancel={() => setQualificationModalVisible(false)}
                    footer={[
                        <Button key="back" onClick={() => setQualificationModalVisible(false)}>
                            Cancel
                        </Button>,
                        <Button
                            key="submit"
                            type="primary"
                            onClick={handleQualificationSubmit}
                            loading={submittingQualification}
                        >
                            Add Qualification
                        </Button>,
                    ]}
                >
                    <Form form={qualificationForm} layout="vertical">
                        <Form.Item
                            name="qualification_id"
                            label="Qualification"
                            rules={[{ required: true, message: 'Please select a qualification' }]}
                        >
                            <Select placeholder="Select a qualification">
                                {qualifications.map((q) => (
                                    <Select.Option
                                        key={q.qualification_id}
                                        value={q.qualification_id}
                                    >
                                        {q.qualification_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="year_acquired"
                            label="Year Acquired"
                            rules={[{ required: true, message: 'Please enter year acquired' }]}
                        >
                            <Input type="number" placeholder="e.g. 2020" />
                        </Form.Item>

                        <Form.Item
                            name="note"
                            label="Additional Notes"
                        >
                            <Input.TextArea placeholder="Any additional information" />
                        </Form.Item>
                    </Form>
                </Modal>
                {/* Specialization Modal */}
                <Modal
                    title="Add Specialization"
                    visible={specializationModalVisible}
                    onCancel={() => setSpecializationModalVisible(false)}
                    footer={[
                        <Button key="back" onClick={() => setSpecializationModalVisible(false)}>
                            Cancel
                        </Button>,
                        // In Modal footer:
                        <Button
                            type="primary"
                            onClick={handleSpecializationSubmit}
                            loading={submittingSpecialization}
                            disabled={submittingSpecialization}
                        >
                            Add Specialization
                        </Button>

                    ]}
                >
                    <Form form={specializationForm} layout="vertical">
                        <Form.Item
                            name="category_id"
                            label="Specialization"
                            rules={[{ required: true, message: 'Please select a specialization' }]}
                        >
                            <Select placeholder="Select a specialization">
                                {petCategories.map(category => (
                                    <Select.Option key={category.category_id} value={category.category_id}>
                                        {category.category_name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Schedule Modal */}
                <Modal
                    title="Add Schedule Slot"
                    visible={scheduleModalVisible}
                    onCancel={() => setScheduleModalVisible(false)}
                    footer={[
                        <Button key="back" onClick={() => setScheduleModalVisible(false)}>
                            Cancel
                        </Button>,
                        <Button
                            type="primary"
                            onClick={handleScheduleSubmit}
                            loading={submittingSchedule}
                            disabled={submittingSchedule}
                        >
                            Add Schedule
                        </Button>,
                    ]}
                >
                    <Form form={scheduleForm} layout="vertical">
                        <Form.Item
                            name="day_of_week"
                            label="Day of Week"
                            rules={[{ required: true, message: 'Please select a day' }]}
                        >
                            <Select placeholder="Select a day">
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <Select.Option key={day} value={day}>{day}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item
                            name="start_time"
                            label="Start Time"
                            rules={[{ required: true, message: 'Please select start time' }]}
                        >
                            <Input type="time" />
                        </Form.Item>
                        <Form.Item
                            name="end_time"
                            label="End Time"
                            rules={[{ required: true, message: 'Please select end time' }]}
                        >
                            <Input type="time" />
                        </Form.Item>
                    </Form>
                </Modal>
            </div>

        </>
    );
};

export default VetProfile;