"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { UploadFile } from "antd";
import StepOne from "./steps/StepOne_Profile";
import StepTwo from "./steps/StepTwo_Socials";
import StepThree from "./steps/StepThree_Verification";
import StepFour from "./steps/StepFour_Facilities";
import StepFive from "./steps/StepFive_Emergency";
import { toast } from "react-hot-toast";
import { MoonLoader } from "react-spinners";

interface FormData {
    shelterName: string;
    address: string;
    description: string;
    logo: File | null;
    photos: File[];
    accountTitle: string;
    iban: string;
    bankName: string;
    socials: {
        instagram: string;
        facebook: string;
        website: string;
    };
    regCert: File | null;
    cnicFront: File | null;
    cnicBack: File | null;
    animalTypes: number[];
    capacity: number;
    emergencyPhone: string;
    backupPhone: string;
    vetName: string;
    vetPhone: string;
    userId: string;
    services: string[];
}

const RescueRegisterContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("user_id");

    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imageList, setImageList] = useState<UploadFile[]>([]);
    const [services, setServices] = useState<string[]>([]);
    const [primaryColor, setPrimaryColor] = useState("#000000");

    const [formData, setFormData] = useState<FormData>({
        shelterName: "",
        address: "",
        description: "",
        logo: null,
        photos: [],
        accountTitle: "",
        iban: "",
        bankName: "",
        socials: {
            instagram: "",
            facebook: "",
            website: "",
        },
        regCert: null,
        cnicFront: null,
        cnicBack: null,
        animalTypes: [],
        capacity: 0,
        emergencyPhone: "",
        backupPhone: "",
        vetName: "",
        vetPhone: "",
        userId: userId || "",
        services: [],
    });

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    useEffect(() => {
        if (!userId) {
            toast.error(
                "Invalid registration flow. Please start from the beginning."
            );
            router.push("/register");
        }
    }, [userId, router]);

    const next = () => setStep((prev) => Math.min(prev + 1, 5));
    const back = () => setStep((prev) => Math.max(prev - 1, 1));

    const handleCompleteRegistration = async () => {
        if (!userId) {
            toast.error("User ID missing. Please start registration again.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Create FormData object
            const formDataToSend = new FormData();

            // Append all non-file fields as JSON
            formDataToSend.append(
                "data",
                JSON.stringify({
                    ...formData,
                    userId,
                    services,
                    socials: formData.socials,
                    animalTypes: formData.animalTypes,
                })
            );

            // Append files
            if (formData.logo) {
                formDataToSend.append("logo", formData.logo);
            }

            formData.photos.forEach((photo) => {
                formDataToSend.append("photos", photo);
            });

            if (formData.regCert) {
                formDataToSend.append("regCert", formData.regCert);
            }

            if (formData.cnicFront) {
                formDataToSend.append("cnicFront", formData.cnicFront);
            }

            if (formData.cnicBack) {
                formDataToSend.append("cnicBack", formData.cnicBack);
            }

            // Make API call
            const response = await fetch("/api/rescue/shelters", {
                method: "POST",
                body: formDataToSend,
            });

            if (!response.ok) {
                throw new Error("Failed to submit registration");
            }

            const result = await response.json();

            if (result.success) {
                toast.success("Shelter registration submitted successfully!");
                router.push("/dashboard");
            } else {
                throw new Error(result.error || "Registration failed");
            }
        } catch (error) {
            console.error("Registration error:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "An unexpected error occurred. Please try again."
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <StepOne
                        data={{
                            shelterName: formData.shelterName,
                            address: formData.address,
                            description: formData.description,
                            logo: formData.logo,
                            photos: formData.photos,
                        }}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        next={next}
                    />
                );
            case 2:
                return (
                    <StepTwo
                        data={formData}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        next={next}
                        back={back}
                    />
                );
            case 3:
                return (
                    <StepThree
                        data={{
                            regCert: formData.regCert,
                            cnicFront: formData.cnicFront,
                            cnicBack: formData.cnicBack,
                        }}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        next={next}
                        back={back}
                    />
                );
            case 4:
                return (
                    <StepFour
                        data={{
                            animalTypes: formData.animalTypes || [],
                            capacity: formData.capacity || 0,
                        }}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        next={next}
                        back={back}
                        isSubmitting={isSubmitting}
                    />
                );
            case 5:
                return (
                    <StepFive
                        data={formData}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        back={back}
                        onSubmit={handleCompleteRegistration}
                        isSubmitting={isSubmitting}
                    />
                );
            default:
                return (
                    <StepOne
                        data={{
                            shelterName: formData.shelterName,
                            address: formData.address,
                            description: formData.description,
                            logo: formData.logo,
                            photos: formData.photos,
                        }}
                        setData={(updatedData) =>
                            setFormData((prev) => ({ ...prev, ...updatedData }))
                        }
                        next={next}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left side static */}
            <div className="lg:w-1/2 lg:h-screen flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none sticky top-0">
                <img
                    src="/paltu_logo.svg"
                    alt="Paltu Logo"
                    className="mb-6 w-3/4 max-w-md"
                />
                <div className="text-center mt-4">
                    <h2 className="text-2xl font-bold mb-2">
                        Rescue Shelter Registration
                    </h2>
                    <p className="text-lg">Step {step} of 5</p>
                    <div className="w-full bg-gray-400 rounded-full h-2.5 mt-4">
                        <div
                            className="bg-white h-2.5 rounded-full"
                            style={{ width: `${(step / 5) * 100}%` }}></div>
                    </div>
                </div>
            </div>

            {/* Right side dynamic form */}
            <div className="w-full sm:w-1/2 bg-gray-100 flex items-center justify-center px-4 py-8 sm:px-8 sm:py-12 transition-all duration-300 ease-in-out">
                {userId ? (
                    isSubmitting ? (
                        <div className="flex flex-col items-center justify-center">
                            <MoonLoader size={30} color={primaryColor} />
                            <p className="mt-4">
                                Submitting your registration...
                            </p>
                        </div>
                    ) : (
                        renderStep()
                    )
                ) : (
                    <div className="text-center">
                        <h3 className="text-xl font-semibold text-red-600">
                            Registration Error
                        </h3>
                        <p className="mt-2">
                            Missing user information. Please start your
                            registration from the beginning.
                        </p>
                        <button
                            onClick={() => router.push("/register")}
                            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition">
                            Go to Registration
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const RescueRegister = () => {
    return (
        <Suspense
            fallback={
                <div className="flex items-center justify-center min-h-screen">
                    <MoonLoader size={50} color="#3B82F6" />
                </div>
            }>
            <RescueRegisterContent />
        </Suspense>
    );
};

export default RescueRegister;
