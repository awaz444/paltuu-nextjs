"use client";
import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";
import { useSession } from "next-auth/react";
import { useAuth } from "@/context/AuthContext";
import {
  BuildingStorefrontIcon,
  MapPinIcon,
  PhoneIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PencilSquareIcon,
  XMarkIcon,
  CheckIcon
} from "@heroicons/react/24/outline";

interface ClinicDetails {
    vet_id: number;
    user_id: number;
    clinic_name: string;
    location: string;
    minimum_fee: number;
    contact_details: string;
    profile_verified: boolean;
    created_at: string;
    bio: string;
    clinic_whatsapp: string;
    clinic_email: string;
    applied: any;
    approved: boolean;
}

const VetClinicTab = () => {
    const { data: session, status } = useSession();
    const { user } = useAuth();

    const [clinicData, setClinicData] = useState<ClinicDetails | null>(null);
    const [clinicForm, setClinicForm] = useState<Partial<ClinicDetails>>({});
    const [vetId, setVetId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const editableClinicFields = [
        'clinic_name',
        'location',
        'contact_details',
        'minimum_fee',
        'clinic_whatsapp',
        'clinic_email'
    ] as const;

    // Get userId from session
    const userId = user?.id || (session?.user as any)?.user_id || null;

    type EditableClinicFields = typeof editableClinicFields[number];

    useEffect(() => {
        // Wait for session to load
        if (status === "loading") {
            setLoading(true);
            return;
        }

        if (!userId) {
            setLoading(false);
            return;
        }

        const loadVetId = async () => {
            try {
                const res = await fetch(`/api/get-vet-id?user_id=${userId}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, [userId, status]);

    useEffect(() => {
        const fetchClinicData = async () => {
            if (!vetId) return;

            try {
                const res = await fetch(`/api/vet-panel/clinic-details/${vetId}`);
                if (!res.ok) throw new Error('Failed to fetch clinic details');
                const data = await res.json();
                setClinicData(data);
                setClinicForm(data);
            } catch (error) {
                console.error("Error fetching clinic data:", error);
                message.error("Failed to load clinic data");
            } finally {
                setLoading(false);
            }
        };

        if (vetId) {
            fetchClinicData();
        }
    }, [vetId]);

    const handleClinicChange = useCallback((field: keyof ClinicDetails, value: string | number) => {
        setClinicForm(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleSaveChanges = async () => {
        if (!vetId) {
            message.error("Clinic not available for saving");
            return;
        }

        setSaving(true);
        try {
            const res = await fetch(`/api/vet-panel/clinic-details/${vetId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(clinicForm)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to update clinic details');
            }

            message.success("Clinic information updated successfully");
            setEditing(false);
            // Refresh data
            const refreshRes = await fetch(`/api/vet-panel/clinic-details/${vetId}`);
            if (refreshRes.ok) {
                const data = await refreshRes.json();
                setClinicData(data);
            }
        } catch (error) {
            console.error('Error saving clinic changes:', error);
            message.error(error instanceof Error ? error.message : "Failed to update clinic information");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setClinicForm(clinicData || {});
        setEditing(false);
    };

    const renderField = (
        field: keyof ClinicDetails,
        label: string,
        icon: React.ReactNode,
        type: string = 'text',
        format?: (value: any) => string
    ) => {
        const validField = editableClinicFields.includes(field as EditableClinicFields)
            ? field as EditableClinicFields
            : null;

        return (
            <div className="bg-white p-4 rounded-xl bg-primary/50 border border-gray-200 hover:border-primary/30 transition-all duration-200 hover:shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        {icon}
                    </div>
                    <label className="text-sm font-medium text-gray-700">
                        {label}
                    </label>
                </div>
                {editing ? (
                    validField && (
                        <div className="relative">
                            <input
                                type={type}
                                value={clinicForm[validField] || ''}
                                onChange={(e) => {
                                    if (field === 'minimum_fee') {
                                        const value = parseFloat(e.target.value);
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
                                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200 bg-gray-50"
                            />
                            <div className="absolute left-3 top-3.5 text-gray-400">
                                {icon}
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex items-center gap-3 min-h-[44px]">
                        <div className="text-gray-400">
                            {icon}
                        </div>
                        <p className="text-gray-800">
                            {format ? format(clinicForm[field]) : clinicForm[field] || "Not provided"}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-primary text-white p-6 rounded-2xl">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold">Clinic Information</h2>
                        <p className="text-primary-100 mt-1">
                            Manage your clinic details and contact information
                        </p>
                    </div>
                    {editing ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                className="px-5 py-2.5 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all flex items-center gap-2 backdrop-blur-sm"
                            >
                                <XMarkIcon className="w-5 h-5" />
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveChanges}
                                disabled={saving}
                                className="px-5 py-2.5 bg-white text-primary rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                            >
                                {saving ? (
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                ) : (
                                    <CheckIcon className="w-5 h-5" />
                                )}
                                {saving ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="px-5 py-2.5 bg-white text-primary rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                        >
                            <PencilSquareIcon className="w-5 h-5" />
                            Edit Clinic Info
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {renderField('clinic_name', 'Clinic Name', <BuildingStorefrontIcon className="w-5 h-5" />)}
                {renderField('location', 'Location', <MapPinIcon className="w-5 h-5" />)}
                {renderField('contact_details', 'Contact Number', <PhoneIcon className="w-5 h-5" />)}
                {renderField('minimum_fee', 'Minimum Fee', <CurrencyDollarIcon className="w-5 h-5" />, 'number', (value) => `Rs. ${value || '0'}`)}
                {renderField('clinic_whatsapp', 'WhatsApp Number', <ChatBubbleLeftRightIcon className="w-5 h-5" />)}
                {renderField('clinic_email', 'Clinic Email', <EnvelopeIcon className="w-5 h-5" />, 'email')}
            </div>
        </div>
    );
};

export default VetClinicTab;