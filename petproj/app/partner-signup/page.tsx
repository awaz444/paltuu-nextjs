"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

const PartnerSignup = () => {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    useEffect(() => {
        // Scroll to top when component mounts
        window.scrollTo(0, 0);
    }, []);

    const handleBackToLogin = () => {
        router.push("/login");
    };

    const handleRoleSelect = (role: string) => {
        setSelectedRole(role);
        if (role === "vet") {
            router.push("/vet-step-zero");
        } else if (role === "shelter") {
            router.push("/rescue-register");
        } else if (role === "shop") {
            router.push("/shop-register");
        }
    };

    const handleBackToHome = () => {
        router.push("/browse-pets");
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
        {/* Left Section (Logo) */}
        <div className="lg:w-1/2 lg:h-screen flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none sticky top-0">
            <button
                onClick={handleBackToLogin}
                className="absolute top-4 left-4 text-white hover:text-white-600 flex items-center">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor">
                    <path
                        fillRule="evenodd"
                        d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            <img
                src="/paltu_logo.svg"
                alt="Paltu Logo"
                className="mb-3 mt-2 w-40 lg:w-full max-w-full"
            />
        </div>

        {/* Right Section (Form) */}
        <div className="lg:w-1/2 bg-gray-100 lg:h-screen lg:overflow-y-auto flex flex-col items-center justify-start px-4 py-8 lg:px-8 lg:py-12 relative">
                <button
                    onClick={handleBackToHome}
                    className="absolute top-4 left-4 text-white hover:text-white-600 flex items-center">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor">
                        <path
                            fillRule="evenodd"
                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <div className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-6">
                    <h2 className="text-3xl font-semibold text-center mb-2">
                        Become a Paltuu Partner
                    </h2>

                    <p className="text-gray-600 text-center mb-6">
                        Choose your partner type to get started
                    </p>

                    {/* Veterinarian Option */}
                    <div 
                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === "vet" ? "border-[#480777] bg-[#f5f0ff]" : "border-gray-200 hover:border-[#480777] hover:bg-[#f5f0ff]"}`}
                        onClick={() => handleRoleSelect("vet")}
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-[#d8ccff] rounded-full flex items-center justify-center mr-4">
                                {/* Stethoscope Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#480777]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-[#480777]">Veterinarian</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Join our network of veterinary professionals. You'll need to verify your qualifications and credentials.
                        </p>
                        <ul className="text-sm text-gray-500 space-y-1">
                            <li>✓ Verify your professional qualifications</li>
                            <li>✓ Get listed in our veterinarian directory</li>
                            <li>✓ Connect with pet owners in your area</li>
                        </ul>
                    </div>

                    {/* Rescue Shelter Option */}
                    <div 
                        className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${selectedRole === "shelter" ? "border-[#004a99] bg-[#f0f9f3]" : "border-gray-200 hover:border-[#004a99] hover:bg-[#f0f9f3]"}`}
                        onClick={() => handleRoleSelect("shelter")}
                    >
                        <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-[#c8f2d4] rounded-full flex items-center justify-center mr-4">
                                {/* Hospital Icon */}
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#004a99]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-2m-9 0H5m2 0h8M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-semibold text-[#004a99]">Rescue Shelter</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Register your rescue organization to help pets find loving homes. You'll need to provide details about your shelter.
                        </p>
                        <ul className="text-sm text-gray-500 space-y-1">
                            <li>✓ List pets available for adoption</li>
                            <li>✓ Connect with potential adopters</li>
                            <li>✓ Access resources for rescue organizations</li>
                        </ul>
                    </div>

                    <div className="text-center mt-6">
                        <p className="text-sm text-gray-600">
                            Already have an account?{" "}
                            <button
                                type="button"
                                className="text-primary font-semibold hover:underline focus:outline-none"
                                onClick={() => router.push("/login")}>
                                Sign in here
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerSignup;