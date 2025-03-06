"use client";
import React, { Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { postVet } from "../store/slices/vetSlice";
import { useRouter, useSearchParams } from "next/navigation";
import { Upload, message } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import type { UploadFile } from "antd/es/upload/interface";

const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
        message.error("You can only upload image files!");
    }
    const isSmallEnough = file.size / 1024 / 1024 < 5; // 5MB max size
    if (!isSmallEnough) {
        message.error("Image must be smaller than 5MB!");
    }
    return isImage && isSmallEnough;
};

const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

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
    const [image, setImage] = useState<UploadFile | null>(null);
    const [bio, setBio] = useState<string>("");

    const handleUploadChange = ({ file }: { file: UploadFile }) => {
        if (file.status === "done") {
            setImage(file);
            message.success(`${file.name} uploaded successfully`);
        } else if (file.status === "error") {
            message.error(`${file.name} file upload failed.`);
        }
    };

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

            {/* Right Section (Form) */}
            <div className="lg:w-1/2 bg-gray-100 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-12">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4"
                >
                    <h2 className="text-2xl lg:text-3xl font-semibold text-center mb-2">
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
                            placeholder="The name of your clinic"
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
                            placeholder="Where it is located. Exclude City"
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
                            type="text"
                            onChange={(e) => setMinimumFee(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            placeholder="Min. Consultancy Fee in PKR (Visible to Users)"
                            required
                        />
                    </div>

                    {/* Clinic Email */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Clinic Email
                        </label>
                        <input
                            type="email"
                            value={clinicEmail}
                            onChange={(e) => setClinicEmail(e.target.value)}
                            placeholder="contact@myvetclinic.com"
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Clinic WhatsApp */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Clinic WhatsApp
                        </label>
                        <div className="flex space-x-2">
                            {/* Disabled input for country code */}
                            <input
                                type="text"
                                value="+92"
                                className="w-12 border border-gray-300 pl-2 rounded-xl py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                disabled
                            />
                            {/* Input for remaining phone number */}
                            <input
                                type="text"
                                value={clinicWhatsapp}
                                onChange={(e) => setClinicWhatsapp(e.target.value)}
                                placeholder="3338888666"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            About Yourself
                        </label>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            rows={4}
                            placeholder="Write a short bio about yourself"
                        />
                    </div>

                    {/* Image Upload */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            An Image of yourself or Clinic Logo
                        </label>
                        <Upload
                            listType="picture-card"
                            maxCount={1}
                            showUploadList={{ showPreviewIcon: false }}
                            onChange={handleUploadChange}
                            action="https://api.cloudinary.com/v1_1/your_cloud_name/image/upload" // Replace with your Cloudinary upload URL
                            data={{
                                upload_preset: "your_upload_preset", // Replace with your Cloudinary preset
                            }}
                        >
                            {image ? null : (
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            )}
                        </Upload>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition"
                    >
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