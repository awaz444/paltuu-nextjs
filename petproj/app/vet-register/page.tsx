"use client";
import React, { Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { postVet } from "../store/slices/vetSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";

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

    const [clinicName, setClinicName] = useState<string>("");
    const [location, setLocation] = useState<string>("");
    const [minimumFee, setMinimumFee] = useState<number>(0);
    const [contactDetails, setContactDetails] = useState<string>("");
    const [clinicEmail, setClinicEmail] = useState<string>("");
    const [clinicWhatsapp, setClinicWhatsapp] = useState<string>("");
    //const [clinicPhoneNumber, setclinicPhoneNumber] = useState<string>("");

    const [bio, setBio] = useState<string>("");
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (userId !== null) {
            const vetData = {
                user_id: userId,
                clinic_name: clinicName,
                location,
                minimum_fee: minimumFee,
                contact_details: contactDetails,
                clinic_email: clinicEmail,
                clinic_whatsapp: clinicWhatsapp,

                bio,
            };

            dispatch(postVet(vetData))
                .unwrap()
                .then((response) => {
                    router.push(`/vet-qualifications?vet_id=${response.vet_id}`);
                })
                .catch((error) => {
                    console.error("Error registering vet:", error);
                });
        }
    };

    return (
        <div className="min-h-screen flex">
            <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
                <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
            </div>

            <div className="w-1/2 bg-gray-100 flex items-center justify-center px-8 py-12">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
                    <h2 className="text-3xl font-semibold text-center mb-2">
                        Register as a Vet
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                        Fill in the details to complete your registration.
                    </p>

                    {/* Clinic Name */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Clinic Name
                        </label>
                        <input
                            type="text"
                            value={clinicName}
                            onChange={(e) => setClinicName(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Location */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Location
                        </label>
                        <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Minimum Fee */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Minimum Fee
                        </label>
                        <input
                            type="number"
                            value={minimumFee}
                            onChange={(e) => setMinimumFee(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/*Clinic Email*/}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Clinic Email
                        </label>
                        <input
                            type="email"
                            value={clinicEmail}
                            onChange={(e) => setClinicEmail(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                    {/*Clinic WhatsApp*/}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Clinic WhatsApp
                        </label>
                        <input
                            type="text"
                            value={clinicWhatsapp}
                            onChange={(e) => setClinicWhatsapp(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>
                

                    {/* Contact Details
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Contact Details
                        </label>
                        <input
                            type="text"
                            value={contactDetails}
                            onChange={(e) => setContactDetails(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div> */}

                    {/* Bio */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Bio (optional)
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            rows={4}
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition">
                        Submit Vet Registration
                    </button>
                </form>
            </div>
        </div>
    );
};

const VetRegister = () => (
    <Suspense fallback={<div>Loading...</div>}>
        <VetRegisterForm />
    </Suspense>
);

export default VetRegister;
