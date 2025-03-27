"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store";
import { fetchCities } from "../store/slices/citiesSlice";
import { postUser } from "../store/slices/userSlice";
import { User } from "../types/user";
import { useRouter } from "next/navigation";
import { EyeOutlined, EyeInvisibleOutlined } from "@ant-design/icons";
import { Modal, Button } from "antd";
import OTPInput from "react-otp-input";

const CreateUser = () => {
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
    const [role, setRole] = useState<"regular user" | "vet">("regular user");

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

    const handleBackToLogin = () => {
        router.push('/login');
    };

    useEffect(() => {
        dispatch(fetchCities());
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setEmailExistsError("");
        setPasswordMismatchError("");
        setFormErrors({});
        setGeneralError("");

        if (!isEmailVerified) {
            setFormErrors(prev => ({ ...prev, email: "Please verify your email first" }));
            setIsLoading(false);
            return;
        }

        if (!validatePassword(password)) {
            setFormErrors(prev => ({
                ...prev,
                password: "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character"
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
        };

        try {
            const result = await dispatch(postUser(newUser));

            if (postUser.rejected.match(result)) {
                const errorPayload = result.payload as { message?: string; errorCode?: string };
                if (errorPayload?.errorCode === 'EMAIL_EXISTS') {
                    setEmailExistsError("This email is already registered");
                    setIsEmailVerified(false);
                    setShowOtpModal(false);
                } else {
                    setGeneralError(errorPayload?.message || "Failed to create account. Please try again.");
                }
                return;
            }

            if (role === "vet") {
                router.push(`/vet-register?user_id=${result.payload.user_id}`);
            } else {
                router.push("/login");
            }
        } catch (error) {
            setGeneralError("An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyEmail = async () => {
        if (!validateEmail(email)) {
            setFormErrors(prev => ({ ...prev, email: "Please enter a valid email address" }));
            return;
        }

        try {
            // Implement actual email verification API call
            const response = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Email verification failed");
            }

            setShowOtpModal(true);
            setFormErrors(prev => ({ ...prev, email: "" }));
        } catch (error) {
            setFormErrors(prev => ({
                ...prev,
                email: error instanceof Error ? error.message : "Failed to send verification code"
            }));
        }
    };

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const validatePassword = (password: string) => {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        return passwordRegex.test(password);
    };

    const handleOtpChange = (otp: string) => {
        setOtp(otp);
        if (otp.length === 6) {
            handleSubmitOtp();
        }
    };

    const handleSubmitOtp = async () => {
        if (otp.length !== 6) {
            setOtpError("Please enter a 6-digit code");
            return;
        }

        try {
            // Implement actual OTP verification API call
            const response = await fetch('/api/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Invalid verification code");
            }

            setIsEmailVerified(true);
            setShowOtpModal(false);
            setOtpError("");
        } catch (error) {
            setOtpError(error instanceof Error ? error.message : "Verification failed");
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row">
            {/* Left Section (Logo) - Unchanged */}
            <div className="lg:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none">
                <img
                    src="/paltu_logo.svg"
                    alt="Paltu Logo"
                    className="mb-6 w-40 lg:w-full max-w-full"
                />
            </div>

            {/* Right Section (Form) */}
            <div className="lg:w-1/2 bg-gray-100 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-12">

                <button
                    onClick={handleBackToLogin}
                    className="absolute top-4 left-4 text-white hover:text-white-600 flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    Back to Login
                </button>

                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white shadow-lg rounded-2xl p-6 space-y-4"
                >
                    <h2 className="text-3xl font-semibold text-center mb-2">Sign Up</h2>
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

                    {/* Email */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Email
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                                disabled={isEmailVerified}
                            />
                            <button
                                type="button"
                                onClick={handleVerifyEmail}
                                disabled={!validateEmail(email) || isEmailVerified}
                                className={`px-4 rounded-xl ${isEmailVerified
                                    ? "bg-green-500 text-white"
                                    : "bg-primary text-white hover:bg-primary-dark"
                                    } transition-colors`}
                            >
                                {isEmailVerified ? "Verified" : "Verify"}
                            </button>
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
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="3338888666"
                                className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                required
                            />
                        </div>
                    </div>

                    {/* Date of Birth */}
                    <div>
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Date of Birth
                        </label>
                        <input
                            type="date"
                            value={DOB}
                            onChange={(e) => setDOB(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
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
                            required
                        >
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
                        <input
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                            pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                        />
                        {/* Show password toggle */}
                        {formErrors.password && (
                            <p className="text-red-500 text-sm mt-1">
                                {formErrors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password */}
                    <div className="relative">
                        <label className="block text-gray-700 text-sm font-medium mb-1">
                            Confirm Password
                        </label>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                        <span
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute inset-y-0 right-3 flex items-center cursor-pointer text-gray-500 mt-6"
                        >
                            {showConfirmPassword ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                        </span>
                    </div>

                    {passwordMismatchError && (
                        <p className="text-red-500 text-sm mt-1">
                            {passwordMismatchError}
                        </p>
                    )}

                    {/* Role Checkbox */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            checked={role === "vet"}
                            onChange={() =>
                                setRole((prevRole) =>
                                    prevRole === "regular user" ? "vet" : "regular user"
                                )
                            }
                            className="h-4 w-4 border-gray-300 text-primary rounded focus:ring-primary focus:outline-none"
                        />
                        <label className="text-gray-700 text-sm">I am a vet</label>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !isEmailVerified || password !== confirmPassword}
                        className={`w-full bg-primary text-white py-2 px-4 rounded-xl transition ${isLoading || !isEmailVerified || password !== confirmPassword
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                            }`}
                    >
                        {isLoading ? "Creating Account..." : "Create Account"}
                    </button>
                </form>
            </div>

            {/* OTP Modal */}
            <Modal
                title="Email Verification"
                visible={showOtpModal}
                onCancel={() => setShowOtpModal(false)}
                footer={null}
                centered
            >
                <div className="space-y-4">
                    <p className="text-gray text-center">
                        Enter the 6-digit code sent to {email}
                    </p>
                    <OTPInput
                        value={otp}
                        onChange={handleOtpChange}
                        numInputs={6}
                        renderSeparator={<span className="mx-2 text-xl text-gray"> </span> as any}
                        renderInput={(props) => <input {...props} />}
                        inputStyle="w-24 h-16 text-3xl text-center border border-gray rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                        containerStyle="flex justify-center space-x-2"
                    />
                    {otpError && <p className="text-red-500 text-center">{otpError}</p>}
                    <button
                        type="button"
                        disabled={otp.length !== 6}
                        onClick={handleSubmitOtp}
                        className={`w-full bg-primary text-white py-2 px-4 rounded-xl transition ${otp.length !== 6 ? "opacity-50 cursor-not-allowed" : "hover:bg-primary-dark"
                            }`}
                    >
                        Verify Code
                    </button>
                </div>
                {otpError && (
                    <p className="text-red-500 text-center text-sm mt-2">
                        {otpError}
                    </p>
                )}
            </Modal>



        </div>
    );
};

export default CreateUser;