"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext"; // Import AuthContext

export default function ForgotPassword() {
    const { isAuthenticated } = useAuth(); // Use AuthContext for API-based login
    const router = useRouter();

    const [email, setEmail] = useState(""); // Only need email for forgot password
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    // Redirect to dashboard if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/browse-pets");
        }
    }, [isAuthenticated, router]);

    // Update button state based on user input
    useEffect(() => {
        setButtonDisabled(!email);
    }, [email]);

    // Handle user input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
    };

    // Handle Forgot Password functionality
    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await axios.post("/api/auth/forgot-password", { email });

            if (response.data.success) {
                toast.success(
                    "Password reset email sent! Please check your inbox and spam folder.",
                    {
                        duration: 5000,
                        position: "top-center",
                    }
                );
                // Optional: Add a delay before showing additional message
                setTimeout(() => {
                    toast.success("You can close this page now.", {
                        duration: 3000,
                        position: "top-center",
                    });
                }, 2000);
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.error || "Error sending reset email.";
            toast.error(errorMessage, {
                duration: 4000,
                position: "top-center",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col sm:flex-row bg-gray-100">
            {/* Left Side */}
            <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
                <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
            </div>

            {/* Right Side */}
            <div className="sm:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-100">
                <h2 className="text-3xl font-semibold mb-4">Reset Password</h2>
                <p className="text-gray-600">
                    Enter your email to access your account.
                </p>

                <form
                    onSubmit={handleForgotPassword}
                    className="mt-8 w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            placeholder="Email"
                            type="email"
                            name="email"
                            value={email}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={buttonDisabled || loading}
                        className={`w-full py-2 px-4 rounded-xl text-white bg-primary hover:bg-primary-dark transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}>
                        {loading ? "Sending Email..." : "Submit"}
                    </button>
                </form>
            </div>
        </div>
    );
}