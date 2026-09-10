"use client";
import React from "react";
import { Button, Input, Typography } from "antd";
import PhoneNumberInput from "@/components/PhoneNumberInput";

const { Title } = Typography;

interface StepFiveProps {
    data: {
        emergencyPhone: string;
        backupPhone: string;
        vetName: string;
        vetPhone: string;
    };
    setData: (updatedData: Partial<StepFiveProps['data']>) => void;
    back: () => void;
    onSubmit: () => void;
    isSubmitting: boolean;
}

const RescueStepFive: React.FC<StepFiveProps> = ({
    data,
    setData,
    back,
    onSubmit,
    isSubmitting
}) => {
    const handleInputChange = (field: keyof StepFiveProps['data'], value: string) => {
        setData({
            [field]: value
        });
    };

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
            <Title level={3} className="text-center">Emergency Info</Title>
            
            {/* Primary Emergency Phone */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Primary Emergency Phone Number
                </label>
                <PhoneNumberInput
                    value={data.emergencyPhone}
                    onChange={(v) => handleInputChange('emergencyPhone', v)}
                    className="border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary"
                />
            </div>

            {/* Backup Phone */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Backup Contact Number (optional)
                </label>
                <PhoneNumberInput
                    value={data.backupPhone}
                    onChange={(v) => handleInputChange('backupPhone', v)}
                    className="border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary"
                />
            </div>

            {/* Vet Name */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    On-call Vet Name (optional)
                </label>
                <Input
                    value={data.vetName}
                    onChange={(e) => handleInputChange('vetName', e.target.value)}
                    placeholder="Dr. Ali Khan"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                />
            </div>

            {/* Vet Phone */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Vet Phone Number (optional)
                </label>
                <PhoneNumberInput
                    value={data.vetPhone}
                    onChange={(v) => handleInputChange('vetPhone', v)}
                    className="border border-gray-300 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-primary"
                />
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={back}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={onSubmit}
                    disabled={!data.emergencyPhone || isSubmitting}
                    className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
                        !data.emergencyPhone || isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                    }`}
                >
                    {isSubmitting ? "Submitting..." : "Complete Registration"}
                </button>
            </div>
        </div>
    );
};

export default RescueStepFive;