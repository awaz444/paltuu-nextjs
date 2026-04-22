// components/auth/SignupForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../app/store/store";
import { fetchCities } from "../../app/store/slices/citiesSlice";
import { postUser } from "../../app/store/slices/userSlice";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User } from "../../app/types/user";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { Modal, Button } from "antd";
import { toast } from "react-hot-toast";
import OTPInput from "react-otp-input";
import PartnerModal from "./PartnerModal";

interface SignupFormProps {
    onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: SignupFormProps) {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { error: userError } = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [DOB, setDOB] = useState("");
    const [cityId, setCityId] = useState<number | null>(null);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [phone_number, setPhoneNumber] = useState("");
    const [role, setRole] = useState<"regular user">("regular user");
    const [showPartnerModal, setShowPartnerModal] = useState(false);

    // OTP Verification States
    const [isEmailVerified, setIsEmailVerified] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");

    const [emailExistsError, setEmailExistsError] = useState("");
    const [passwordMismatchError, setPasswordMismatchError] = useState("");
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [generalError, setGeneralError] = useState("");

    const [isLoading, setIsLoading] = useState(false);

    const [isEmailFocused, setIsEmailFocused] = useState(false);
    const [isPasswordFocused, setIsPasswordFocused] = useState(false);

    const [googleLoading, setGoogleLoading] = useState(false);

    const [isVerifying, setIsVerifying] = useState(false);
    const [isEmailVerifying, setIsEmailVerifying] = useState(false);

    const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] =
        useState(false);

    useEffect(() => {
        dispatch(fetchCities());
    }, [dispatch]);

    const handleBackToLogin = () => {
        router.push("/");
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            await signIn("google", {
                callbackUrl: "/browse-pets",
            });
        } catch (error) {
            console.error("Google login failed:", error);
            toast.error("Google login failed. Please try again!");
        } finally {
            setGoogleLoading(false);
        }
    };

    const PasswordRules = ({ password }: { password: string }) => (
        <div className="mt-0 space-y-1 text-sm">
            <p
                className={`flex items-center ${password.length > 0 ? "text-gray-600" : "text-gray-400"
                    }`}>
                Password must contain:
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li
                    className={`flex items-center ${password.length >= 6 ? "text-green-500" : "text-red-500"
                        }`}>
                    {password.length >= 6 ? "✓" : "✗"} Minimum 6 characters
                </li>
                <li
                    className={`flex items-center ${/[A-Za-z]/.test(password)
                        ? "text-green-500"
                        : "text-red-500"
                        }`}>
                    {/[A-Za-z]/.test(password) ? "✓" : "✗"} At least one letter
                </li>
            </ul>
        </div>
    );

    const ConfirmPasswordValidation = ({
        password,
        confirmPassword,
    }: {
        password: string;
        confirmPassword: string;
    }) => (
        <div className="mt-0 space-y-1 text-sm">
            <p
                className={`flex items-center ${confirmPassword.length > 0
                    ? "text-gray-600"
                    : "text-gray-400"
                    }`}>
                Confirm password must:
            </p>
            <ul className="list-disc pl-5 space-y-1">
                <li
                    className={`flex items-center ${password === confirmPassword &&
                        confirmPassword.length > 0
                        ? "text-green-500"
                        : "text-red-500"
                        }`}>
                    {password === confirmPassword && confirmPassword.length > 0
                        ? "✓"
                        : "✗"}
                    Match the password above
                </li>
            </ul>
        </div>
    );

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setEmailExistsError("");
        setPasswordMismatchError("");
        setFormErrors({});
        setGeneralError("");

        if (!isEmailVerified) {
            setFormErrors((prev) => ({
                ...prev,
                email: "Please verify your email first",
            }));
            setIsLoading(false);
            return;
        }

        if (!validatePassword(password)) {
            setFormErrors((prev) => ({
                ...prev,
                password:
                    "Password must be at least 6 characters long and contain at least one letter",
            }));
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setPasswordMismatchError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        const newUser: Omit<User, "user_id"> = {
            username,
            name,
            DOB,
            city_id: cityId,
            email,
            password,
            phone_number,
            role: "regular user",
            otp: otp, // Pass verified OTP for backend registration
        };

        try {
            const result = await dispatch(postUser(newUser));

            if (postUser.rejected.match(result)) {
                const errorPayload = result.payload as {
                    message?: string;
                    errorCode?: string;
                    error?: string;
                };
                if (errorPayload?.errorCode === "EMAIL_EXISTS") {
                    setEmailExistsError("This email is already registered");
                    setIsEmailVerified(false);
                    setShowOtpModal(false);
                } else if (errorPayload?.error) {
                    setGeneralError(errorPayload.error);
                } else {
                    setGeneralError(
                        errorPayload?.message ||
                        "Failed to create account. Please try again."
                    );
                }
                return;
            }

            router.push("/browse-pets");
        } catch (error) {
            setGeneralError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!validateEmail(email)) {
            setFormErrors((prev) => ({
                ...prev,
                email: "Please enter a valid email address",
            }));
            return;
        }

        try {
            setIsEmailVerifying(true);
            const response = await fetch("/api/v1/auth/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Email verification failed"
                );
            }

            setShowOtpModal(true);
            setFormErrors((prev) => ({ ...prev, email: "" }));
        } catch (error) {
            setFormErrors((prev) => ({
                ...prev,
                email:
                    error instanceof Error
                        ? error.message
                        : "Failed to send verification code",
            }));
        } finally {
            setIsEmailVerifying(false);
        }
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const EmailValidation = ({ email }: { email: string }) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        return (
            <div className="mt-0 space-y-1 text-sm">
                <p
                    className={`flex items-center ${email.length > 0 ? "text-gray-600" : "text-gray-400"
                        }`}>
                    Email must be:
                </p>
                <ul className="list-disc pl-5 space-y-1">
                    <li
                        className={`flex items-center ${isValid ? "text-green-500" : "text-red-500"
                            }`}>
                        {isValid ? "✓" : "✗"} Properly formatted (e.g.,
                        example@domain.com)
                    </li>
                </ul>
            </div>
        );
    };

    const validatePassword = (password: string) => {
        const passwordRegex = /^(?=.*[A-Za-z]).{6,}$/;
        return passwordRegex.test(password);
    };

    const handleOtpChange = (otp: string) => {
        setOtp(otp);
        setOtpError("");
    };

    const handleSubmitOtp = async () => {
        try {
            setIsVerifying(true);
            const response = await fetch("/api/v1/auth/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                if (errorData.message.includes("Invalid")) {
                    throw new Error("Invalid OTP");
                } else if (errorData.message.includes("Not Found")) {
                    throw new Error("OTP Not Found or Invalid");
                } else {
                    throw new Error("Verification failed");
                }
            }

            setIsEmailVerified(true);
            setShowOtpModal(false);
            setOtpError("");
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Verification failed";
            if (
                errorMessage === "Invalid OTP" ||
                errorMessage === "OTP Not Found or Invalid"
            ) {
                setOtpError(errorMessage);
            } else {
                setOtpError("");
            }
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-center mb-2">Sign Up</h2>

            {/* Google Login Button */}
            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className={`w-full py-2 px-4 rounded-xl text-gray-600 border border-gray-400 focus:outline-none transition flex items-center justify-center space-x-2 ${googleLoading ? "opacity-50 cursor-not-allowed" : ""
                    }`}>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="w-5 h-5">
                    <path
                        d="M23.76 12.26c0-.79-.07-1.58-.19-2.34H12v4.44h6.66c-.29 1.56-1.15 2.88-2.46 3.76v3.12h3.98c2.32-2.14 3.68-5.29 3.68-8.98z"
                        fill="#4285F4"
                    />
                    <path
                        d="M12 24c3.3 0 6.07-1.09 8.09-2.94l-3.98-3.12c-1.1.74-2.52 1.18-4.11 1.18-3.15 0-5.82-2.13-6.77-5.01H1.2v3.14C3.25 21.08 7.34 24 12 24z"
                        fill="#34A853"
                    />
                    <path
                        d="M5.23 14.12c-.25-.74-.39-1.54-.39-2.37 0-.83.14-1.63.38-2.37V6.23H1.2A11.98 11.98 0 000 12c0 1.89.44 3.68 1.2 5.27l4.03-3.15z"
                        fill="#FBBC05"
                    />
                    <path
                        d="M12 4.74c1.8 0 3.4.62 4.67 1.84l3.5-3.5C17.99 1.12 15.22 0 12 0 7.34 0 3.25 2.92 1.2 6.73l4.03 3.15c.94-2.88 3.61-5.01 6.77-5.01z"
                        fill="#EA4335"
                    />
                </svg>
                <span>
                    {googleLoading ? "Logging in..." : "Continue with Google"}
                </span>
            </button>

            {/* OR Divider */}
            <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-500">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <p className="text-gray-600 text-center mb-6">
                Fill in the details to create a new account.
            </p>

            {/* Full Name */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Full Name
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    placeholder="Enter your full name"
                    required
                />
            </div>

            {generalError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {generalError}
                </div>
            )}

            <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Email
                </label>
                <div className="flex gap-2 relative">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() =>
                            setTimeout(() => setIsEmailFocused(false), 100)
                        }
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                        disabled={isEmailVerified}
                    />
                    <button
                        type="button"
                        onClick={handleVerifyEmail}
                        disabled={!validateEmail(email) || isEmailVerified || isEmailVerifying}
                        className={`px-4 rounded-xl transition-colors ${isEmailVerified
                            ? "bg-green-500 text-white"
                            : validateEmail(email)
                                ? "bg-primary text-white"
                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }`}>
                        {isEmailVerifying ? "Loading..." : isEmailVerified ? "Verified" : "Verify"}
                    </button>

                    {isEmailFocused && !isEmailVerified && (
                        <div className="absolute top-full left-0 mt-2 w-full z-10 animate-popup">
                            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                <EmailValidation email={email} />
                            </div>
                        </div>
                    )}
                </div>
                {(formErrors.email || emailExistsError) && (
                    <p className="text-red-500 text-sm mt-1">
                        {formErrors.email || emailExistsError}
                    </p>
                )}
            </div>

            {/* Phone Number */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Phone Number
                </label>
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value="+92"
                        className="w-12 border border-gray-300 pl-2 rounded-xl py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        disabled
                    />
                    <input
                        type="text"
                        value={phone_number}
                        onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            if (value.length <= 10) setPhoneNumber(value);
                        }}
                        placeholder="3338888666"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                        maxLength={10}
                    />
                </div>
            </div>

            {/* City */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    City
                </label>
                <select
                    value={cityId || ""}
                    onChange={(e) => setCityId(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    required>
                    <option value="">Select a City</option>
                    {cities.map((city) => (
                        <option key={city.city_id} value={city.city_id}>
                            {city.city_name}
                        </option>
                    ))}
                </select>
            </div>

            <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Password
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setIsPasswordFocused(true)}
                        onBlur={() =>
                            setTimeout(() => setIsPasswordFocused(false), 100)
                        }
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                        pattern="^(?=.*[A-Za-z]).{6,}$"
                    />
                    <span
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 mt-1">
                        {showPassword ? (
                            <EyeInvisibleOutlined />
                        ) : (
                            <EyeOutlined />
                        )}
                    </span>
                    {isPasswordFocused && (
                        <div className="absolute top-full left-0 mt-2 w-full z-10 animate-popup">
                            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                <PasswordRules password={password} />
                            </div>
                        </div>
                    )}
                </div>
                {formErrors.password && (
                    <p className="text-red-500 text-sm mt-1">
                        {formErrors.password}
                    </p>
                )}
            </div>

            <div className="relative">
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Confirm Password
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setIsConfirmPasswordFocused(true)}
                        onBlur={() =>
                            setTimeout(
                                () => setIsConfirmPasswordFocused(false),
                                100
                            )
                        }
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        required
                    />
                    <span
                        onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 mt-1">
                        {showConfirmPassword ? (
                            <EyeInvisibleOutlined />
                        ) : (
                            <EyeOutlined />
                        )}
                    </span>

                    {isConfirmPasswordFocused && confirmPassword.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-full z-10 animate-popup">
                            <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
                                <ConfirmPasswordValidation
                                    password={password}
                                    confirmPassword={confirmPassword}
                                />
                            </div>
                        </div>
                    )}
                </div>
                {passwordMismatchError && (
                    <p className="text-red-500 text-sm mt-1">
                        {passwordMismatchError}
                    </p>
                )}
            </div>

            <button
                type="submit"
                disabled={
                    isLoading ||
                    !isEmailVerified ||
                    password !== confirmPassword
                }
                className={`w-full bg-primary text-white py-2 px-4 rounded-xl transition ${isLoading ||
                    !isEmailVerified ||
                    password !== confirmPassword
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                    }`}>
                {isLoading ? "Creating Account..." : "Create Account"}
            </button>

            {/* Switch to Login - Simple text link */}
            <div className="text-center border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600">
                    Already have an account?{" "}
                    <button
                        type="button"
                        className="text-primary font-semibold hover:underline focus:outline-none"
                        onClick={onSwitchToLogin}>
                        Sign in
                    </button>
                </p>
            </div>

            {/* Partner Signup Link */}
            <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                    Are you a vet, clinic, or rescue?{" "}
                    <button
                        type="button"
                        className="text-primary font-semibold hover:underline focus:outline-none"
                        onClick={() => setShowPartnerModal(true)}>
                        Contact us
                    </button>
                </p>
            </div>

            <PartnerModal
                visible={showPartnerModal}
                onClose={() => setShowPartnerModal(false)}
            />

            <Modal
                title="Email Verification"
                visible={showOtpModal}
                onCancel={() => setShowOtpModal(false)}
                footer={null}
                centered
                className="[&_.ant-modal-content]:p-6">
                <div className="space-y-4">
                    <p className="text-center text-gray-600">
                        Enter the 6-digit code sent to {email}
                    </p>
                    <OTPInput
                        value={otp}
                        onChange={handleOtpChange}
                        numInputs={6}
                        renderSeparator={<span className="mx-1" />}
                        renderInput={(props) => (
                            <input
                                {...props}
                                style={{ width: "3.5rem", height: "3.5rem" }}
                                type="tel"
                                inputMode="numeric"
                                className="text-2xl text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                maxLength={1}
                            />
                        )}
                        containerStyle="flex justify-center gap-2"
                        shouldAutoFocus
                    />
                    {otpError && (
                        <p className="text-red-500 text-center text-sm">
                            {otpError === "Invalid OTP" ||
                                otpError === "OTP Not Found or Invalid"
                                ? otpError
                                : null}
                        </p>
                    )}
                    <div className="flex gap-2 mt-4">
                        <button
                            type="button"
                            onClick={handleSubmitOtp}
                            disabled={otp.length !== 6 || isVerifying}
                            className={`w-full bg-primary text-white py-2 rounded-lg transition flex items-center justify-center ${otp.length !== 6 || isVerifying
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                                }`}>
                            {isVerifying ? "Loading..." : "Verify Code"}
                        </button>
                        <button
                            type="button"
                            onClick={handleVerifyEmail}
                            className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg transition">
                            Resend Code
                        </button>
                    </div>
                    {/* Mobile Number Pad Hint */}
                    <p className="text-center text-sm text-gray-500 md:hidden">
                        Numeric keypad will appear on mobile devices
                    </p>
                </div>
            </Modal>
        </form>
    );
}
