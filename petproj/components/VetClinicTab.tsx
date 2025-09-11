"use client";
import React, { useState, useEffect, useCallback } from "react";
import { message } from "antd";

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
    const [clinicData, setClinicData] = useState<ClinicDetails | null>(null);
    const [clinicForm, setClinicForm] = useState<Partial<ClinicDetails>>({});
    const [vetId, setVetId] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    const editableClinicFields = [
        'clinic_name',
        'location',
        'contact_details',
        'minimum_fee',
        'clinic_whatsapp',
        'clinic_email'
    ] as const;

    type EditableClinicFields = typeof editableClinicFields[number];

    useEffect(() => {
        const loadVetId = async () => {
            const storedUser = localStorage.getItem("user");
            if (!storedUser) return;

            const parsedUser = JSON.parse(storedUser);
            if (!parsedUser?.id) return;

            try {
                const res = await fetch(`/api/get-vet-id?user_id=${parsedUser.id}`);
                if (!res.ok) throw new Error('Failed to fetch vet ID');
                const data = await res.json();
                setVetId(data.vet_id);
            } catch (error) {
                console.error("Error fetching vet ID:", error);
            }
        };

        loadVetId();
    }, []);

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
        }
    };

    const handleCancel = () => {
        setClinicForm(clinicData || {});
        setEditing(false);
    };

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
                <label className="text-sm font-medium text-gray-600">
                    {label}
                </label>
                {editing ? (
                    validField && (
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Clinic Information</h2>
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
                        Edit Clinic Info
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderField('clinic_name', 'Clinic Name')}
                {renderField('location', 'Location')}
                {renderField('contact_details', 'Contact Number')}
                {renderField('minimum_fee', 'Minimum Fee', 'number', (value) => `Rs. ${value || '0'}`)}
                {renderField('clinic_whatsapp', 'WhatsApp Number')}
                {renderField('clinic_email', 'Clinic Email', 'email')}
            </div>
        </div>
    );
};

export default VetClinicTab;