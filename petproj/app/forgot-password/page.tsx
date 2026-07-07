"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

type Step = "email" | "otp" | "newPassword";

export default function ForgotPassword() {
    const { isAuthenticated } = useAuth();
    const router = useRouter();

    // Step management
    const [step, setStep] = useState<Step>("email");

    // Step 1: Email
    const [email, setEmail] = useState("");

    // Step 2: OTP
    const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
    const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [resendCooldown, setResendCooldown] = useState(0);

    // Step 3: New Password
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);

    // Shared
    const [loading, setLoading] = useState(false);

    // Redirect if authenticated
    useEffect(() => {
        if (isAuthenticated) {
            router.push("/browse-pets");
        }
    }, [isAuthenticated, router]);

    // Resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    // ─── Step 1: Send OTP ─────────────────────────────────
    const handleSendOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!email) return;
        try {
            setLoading(true);
            await axios.post("/api/v1/auth/forgot-password-otp", { email });
            toast.success("A 6-digit code has been sent to your email!", {
                duration: 4000,
                position: "top-center",
            });
            setStep("otp");
            setResendCooldown(60);
            // Focus first OTP input after step transition
            setTimeout(() => otpRefs.current[0]?.focus(), 100);
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error sending reset code.";
            toast.error(msg, { duration: 4000, position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 2: OTP input handling ──────────────────────
    const handleOtpChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return; // digits only
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1); // take last digit
        setOtp(newOtp);

        // Auto-advance to next box
        if (value && index < 5) {
            otpRefs.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpRefs.current[index - 1]?.focus();
        }
    };

    const handleOtpPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
        if (!pasted) return;
        const newOtp = [...otp];
        for (let i = 0; i < 6; i++) {
            newOtp[i] = pasted[i] || "";
        }
        setOtp(newOtp);
        // Focus the next empty or the last box
        const nextEmpty = newOtp.findIndex((d) => !d);
        otpRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();
    };

    const handleVerifyOtp = async (e?: React.FormEvent) => {
        e?.preventDefault();
        const code = otp.join("");
        if (code.length < 6) {
            toast.error("Please enter the full 6-digit code.", { position: "top-center" });
            return;
        }
        try {
            setLoading(true);
            await axios.post("/api/v1/auth/verify-otp", {
                email,
                otp: code,
            });
            setStep("newPassword");
        } catch (error: any) {
            const msg = error.response?.data?.error || "Invalid code or expired.";
            toast.error(msg, { duration: 4000, position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return;
        try {
            setLoading(true);
            await axios.post("/api/v1/auth/forgot-password-otp", { email });
            toast.success("A new code has been sent!", { duration: 3000, position: "top-center" });
            setOtp(["", "", "", "", "", ""]);
            setResendCooldown(60);
            otpRefs.current[0]?.focus();
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error resending code.";
            toast.error(msg, { duration: 4000, position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    // ─── Step 3: Reset Password ──────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword.length < 8) {
            toast.error("Password must be at least 8 characters.", { position: "top-center" });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Passwords don't match.", { position: "top-center" });
            return;
        }

        try {
            setLoading(true);
            const code = otp.join("");
            await axios.post("/api/v1/auth/reset-password-otp", {
                email,
                otp: code,
                newPassword,
            });
            toast.success("Password reset successful!", {
                duration: 3000,
                position: "top-center",
            });
            setTimeout(() => {
                toast.success("Redirecting to login...", {
                    duration: 2000,
                    position: "top-center",
                });
            }, 1500);
            setTimeout(() => {
                router.push("/auth");
            }, 3500);
        } catch (error: any) {
            const msg = error.response?.data?.error || "Error resetting password.";
            toast.error(msg, { duration: 4000, position: "top-center" });
        } finally {
            setLoading(false);
        }
    };

    // ─── Step indicator ──────────────────────────────────
    const stepNumber = step === "email" ? 1 : step === "otp" ? 2 : 3;

    const StepIndicator = () => (
        <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center gap-2">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                            s < stepNumber
                                ? "bg-green-500 text-white"
                                : s === stepNumber
                                ? "bg-primary text-white scale-110"
                                : "bg-gray-200 text-gray-500"
                        }`}
                    >
                        {s < stepNumber ? "✓" : s}
                    </div>
                    {s < 3 && (
                        <div
                            className={`w-8 h-0.5 transition-all duration-300 ${
                                s < stepNumber ? "bg-green-500" : "bg-gray-200"
                            }`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex flex-col sm:flex-row bg-gray-100">
            {/* Left Side */}
            <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl relative">
                <button
                    onClick={() => {
                        if (step === "otp") setStep("email");
                        else if (step === "newPassword") setStep("otp");
                        else router.push("/auth");
                    }}
                    className="absolute top-4 left-4 text-white hover:text-gray-200 flex items-center transition-colors"
                    title="Go Back"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-1"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            fillRule="evenodd"
                            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                            clipRule="evenodd"
                        />
                    </svg>
                </button>
                <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
            </div>

            {/* Right Side */}
            <div className="sm:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 bg-gray-100">
                <StepIndicator />

                {/* ═══ Step 1: Email ═══ */}
                {step === "email" && (
                    <>
                        <h2 className="text-3xl font-semibold mb-2">Reset Password</h2>
                        <p className="text-gray-600 mb-6 text-center">
                            Enter your email and we&apos;ll send you a 6-digit code.
                        </p>
                        <form
                            onSubmit={handleSendOtp}
                            className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6"
                        >
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Email
                                </label>
                                <input
                                    placeholder="Enter your email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                    required
                                    autoFocus
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={!email || loading}
                                className={`w-full py-2 px-4 rounded-xl text-white bg-primary hover:opacity-90 transition ${
                                    loading || !email ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                            >
                                {loading ? "Sending Code..." : "Send Reset Code"}
                            </button>
                        </form>
                    </>
                )}

                {/* ═══ Step 2: OTP ═══ */}
                {step === "otp" && (
                    <>
                        <h2 className="text-3xl font-semibold mb-2">Enter Code</h2>
                        <p className="text-gray-600 mb-1 text-center">
                            We sent a 6-digit code to
                        </p>
                        <p className="text-primary font-semibold mb-6 text-center">{email}</p>
                        <form
                            onSubmit={handleVerifyOtp}
                            className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6"
                        >
                            {/* OTP Digit Boxes */}
                            <div className="flex justify-center gap-3 mb-6" onPaste={handleOtpPaste}>
                                {otp.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { otpRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleOtpChange(i, e.target.value)}
                                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                                        className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl focus:outline-none transition-all ${
                                            digit
                                                ? "border-primary bg-red-50"
                                                : "border-gray-300 focus:border-primary"
                                        }`}
                                    />
                                ))}
                            </div>

                            {/* Resend */}
                            <div className="flex justify-center items-center gap-1 mb-6 text-sm">
                                <span className="text-gray-500">Didn&apos;t receive a code?</span>
                                <button
                                    type="button"
                                    onClick={handleResendOtp}
                                    disabled={resendCooldown > 0 || loading}
                                    className={`font-semibold ${
                                        resendCooldown > 0
                                            ? "text-gray-400 cursor-not-allowed"
                                            : "text-primary hover:underline"
                                    }`}
                                >
                                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                                </button>
                            </div>

                            <button
                                type="submit"
                                disabled={otp.join("").length < 6 || loading}
                                className={`w-full py-2 px-4 rounded-xl text-white bg-primary hover:opacity-90 transition ${
                                    otp.join("").length < 6
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                Verify Code
                            </button>
                        </form>
                    </>
                )}

                {/* ═══ Step 3: New Password ═══ */}
                {step === "newPassword" && (
                    <>
                        <h2 className="text-3xl font-semibold mb-2">New Password</h2>
                        <p className="text-gray-600 mb-6 text-center">
                            Create a new password for your account.
                        </p>
                        <form
                            onSubmit={handleResetPassword}
                            className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6"
                        >
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        placeholder="Enter new password"
                                        type={showNewPw ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 pr-10 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                        minLength={8}
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPw(!showNewPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showNewPw ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-medium mb-2">
                                    Confirm Password
                                </label>
                                <div className="relative">
                                    <input
                                        placeholder="Confirm new password"
                                        type={showConfirmPw ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full border border-gray-300 rounded-xl px-3 py-2 pr-10 focus:ring-2 focus:ring-primary focus:outline-none"
                                        required
                                        minLength={8}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPw ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">Passwords don&apos;t match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword ||
                                    loading
                                }
                                className={`w-full py-2 px-4 rounded-xl text-white bg-primary hover:opacity-90 transition ${
                                    loading ||
                                    !newPassword ||
                                    !confirmPassword ||
                                    newPassword !== confirmPassword
                                        ? "opacity-50 cursor-not-allowed"
                                        : ""
                                }`}
                            >
                                {loading ? "Resetting Password..." : "Reset Password"}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}