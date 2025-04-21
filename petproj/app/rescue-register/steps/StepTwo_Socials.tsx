"use client";
import React from "react";

interface StepTwoProps {
    data: {
        accountTitle: string;
        iban: string;
        bankName: string;
        socials: {
            instagram: string;
            facebook: string;
            website: string;
        };
    };
    setData: (updatedData: Partial<StepTwoProps['data']>) => void;
    next: () => void;
    back: () => void;
}

const RescueStepTwo: React.FC<StepTwoProps> = ({
    data,
    setData,
    next,
    back
}) => {
    const handleInputChange = (field: keyof Omit<StepTwoProps['data'], 'socials'>, value: string) => {
        setData({ [field]: value });
    };

    const handleSocialChange = (platform: keyof StepTwoProps['data']['socials'], value: string) => {
        setData({
            socials: {
                ...data.socials,
                [platform]: value
            }
        });
    };

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-center">Charity & Socials</h2>
            <p className="text-gray-600 text-center mb-6">
                Add your banking and social media information
            </p>

            {/* Bank Account Info */}
            <div className="space-y-4">
                <h3 className="text-gray-700 text-sm font-medium">Bank Account Information</h3>
                
                <div>
                    <label className="block text-gray-600 text-xs mb-1">IBAN / Account Number</label>
                    <input
                        type="text"
                        value={data.iban}
                        onChange={(e) => handleInputChange('iban', e.target.value)}
                        placeholder="PK36 SCBL 0000 0011 2345 6702"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-600 text-xs mb-1">Account Title</label>
                    <input
                        type="text"
                        value={data.accountTitle}
                        onChange={(e) => handleInputChange('accountTitle', e.target.value)}
                        placeholder="Paws Rescue Foundation"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-600 text-xs mb-1">Bank Name</label>
                    <input
                        type="text"
                        value={data.bankName}
                        onChange={(e) => handleInputChange('bankName', e.target.value)}
                        placeholder="Standard Chartered Bank"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                </div>
            </div>

            {/* Social Media Links */}
            <div className="space-y-4 pt-4">
                <h3 className="text-gray-700 text-sm font-medium">Socials (optional but recommended)</h3>
                
                <div>
                    <label className="block text-gray-600 text-xs mb-1">Instagram</label>
                    <input
                        type="text"
                        value={data.socials.instagram}
                        onChange={(e) => handleSocialChange('instagram', e.target.value)}
                        placeholder="https://instagram.com/your-shelter"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-gray-600 text-xs mb-1">Facebook</label>
                    <input
                        type="text"
                        value={data.socials.facebook}
                        onChange={(e) => handleSocialChange('facebook', e.target.value)}
                        placeholder="https://facebook.com/your-shelter"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>

                <div>
                    <label className="block text-gray-600 text-xs mb-1">Website / Linktree</label>
                    <input
                        type="text"
                        value={data.socials.website}
                        onChange={(e) => handleSocialChange('website', e.target.value)}
                        placeholder="https://linktr.ee/your-shelter"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    />
                </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6">
                <button
                    type="button"
                    onClick={back}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={next}
                    disabled={!data.iban || !data.accountTitle || !data.bankName}
                    className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
                        !data.iban || !data.accountTitle || !data.bankName
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default RescueStepTwo;