"use client";
import React, { Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { postVet } from "../store/slices/vetSlice";
import { useRouter, useSearchParams } from "next/navigation";

const VetRegisterForm = () => {
    const dispatch = useDispatch<AppDispatch>();

    const router = useRouter();
    const searchParams = useSearchParams();
    const user_id = searchParams.get("user_id"); // Get user_id from URL query parameters
    const userId = user_id ? parseInt(user_id, 10) : null;

    const { qualifications } = useSelector(
        (state: RootState) => state.qualifications
    );
    const { categories } = useSelector((state: RootState) => state.categories);

    console.log("Received user_id:", userId);

    const [clinicName, setClinicName] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [minimumFee, setMinimumFee] = useState<number>(0);
    const [contactDetails, setContactDetails] = useState<string>("");
    const [bio, setBio] = useState<string>("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (userId !== null) {
            const vetData = {
                user_id: userId,
                clinic_name: clinicName,
                location,
                minimum_fee: minimumFee,
                contact_details: contactDetails,
                bio,
            };

            console.log("Sending vet data:", vetData);

            dispatch(postVet(vetData))
            .unwrap()
            .then((response) => {
                console.log("Vet registered successfully:", response);

                // Redirect to the vet qualifications page with the vet_id
                router.push(`/vet-qualifications?vet_id=${response.vet_id}`);
            })
            .catch((error) => {
                console.error("Error registering vet:", error);
            });
    } else {
            console.error(
                "User ID is missing. Cannot submit vet registration."
            );
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
            <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
                Register as a Vet
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Form fields here */}
                <div className="flex flex-col">
                    <label
                        htmlFor="clinicName"
                        className="text-lg font-medium text-gray-700 mb-2">
                        Clinic Name:
                    </label>
                    <input
                        id="clinicName"
                        type="text"
                        value={clinicName}
                        onChange={(e) => setClinicName(e.target.value)}
                        required
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="location"
                        className="text-lg font-medium text-gray-700 mb-2">
                        Location:
                    </label>
                    <input
                        id="location"
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        required
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="minimumFee"
                        className="text-lg font-medium text-gray-700 mb-2">
                        Minimum Fee:
                    </label>
                    <input
                        id="minimumFee"
                        type="number"
                        value={minimumFee}
                        onChange={(e) => setMinimumFee(Number(e.target.value))}
                        required
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="contactDetails"
                        className="text-lg font-medium text-gray-700 mb-2">
                        Contact Details:
                    </label>
                    <input
                        id="contactDetails"
                        type="text"
                        value={contactDetails}
                        onChange={(e) => setContactDetails(e.target.value)}
                        required
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex flex-col">
                    <label
                        htmlFor="bio"
                        className="text-lg font-medium text-gray-700 mb-2">
                        Bio (optional):
                    </label>
                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition duration-300">
                    Submit Vet Registration
                </button>
            </form>
        </div>
    );
};

const VetRegister = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <VetRegisterForm />
    </Suspense>
);

export default VetRegister;
