"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

export default function Login() {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
    });
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);

    // Update button state based on user input
    useEffect(() => {
        setButtonDisabled(!(user.email && user.password));
    }, [user]);

    // Handle user input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setUser((prev) => ({ ...prev, [name]: value }));
    };

    // Handle login form submission
    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault(); // Prevent default form submission
        try {
            setLoading(true);
            const response = await axios.post("/api/users/login", user);
            console.log("Login success:", response.data);
            toast.success("Login successful!");
            router.push("/profile");
        } catch (error: any) {
            console.error("Login failed:", error.message);
            toast.error(error.response?.data?.message || "Login failed!");
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
                <h2 className="text-3xl font-semibold mb-4">Login</h2>
                <p className="text-gray-600">
                    Enter your credentials to access your account.
                </p>

                <form
                    onSubmit={handleLogin}
                    className="mt-8 w-full max-w-md bg-white shadow-lg rounded-2xl p-6">
                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            className="w-full border border-gray-300  rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-medium mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            name="password"
                            value={user.password}
                            onChange={handleInputChange}
                            className="w-full  border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            required
                        />
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={buttonDisabled || loading}
                        className={`w-full py-2 px-4 rounded-xl text-white bg-primary hover:bg-primary-dark transition ${
                            loading ? "opacity-50 cursor-not-allowed" : ""
                        }`}>
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    {/* Google Login */}
                    <button
                        type="button"
                        onClick={() => signIn("google")}
                        className="mt-4 w-full py-2 px-4 rounded-xl text-gray-600 border border-gray-400 hover:border-primary hover:text-primary transition flex items-center justify-center space-x-2">
                        {/* Google Icon */}
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
                        <span>Login with Google</span>
                    </button>

                    {/* Forgot Password */}
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            className="text-primary hover:underline focus:outline-none">
                            Forgot Password?
                        </button>
                    </div>

                    {/* Create Account */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            New to Paltuu?{" "}
                            <button
                                type="button"
                                className="text-primary font-semibold hover:underline focus:outline-none"
                                onClick={() => router.push("/sign-up")}>
                                Create an account
                            </button>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
