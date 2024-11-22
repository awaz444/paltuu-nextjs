"use client";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import './style.css';

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
        <div className="flex min-h-screen bg-white">
            {/* Left Side */}
            <div
                style={{ backgroundColor: "#A03048" }}
                className="w-1/2 flex flex-col justify-center items-center p-10"
            >
                <img src="/paltu_logo.svg" alt="Paltu Logo" />
            </div>

            {/* Right Side */}
            <div className="w-1/2 flex flex-col justify-center items-start p-10">
                <h2 className="text-3xl font-semibold">Welcome</h2>
                <p className="text-gray-500 mt-2">Log in to your account</p>

                <form
                    onSubmit={handleLogin}
                    className="mt-8 w-3/4 bg-white shadow-lg rounded-lg p-8"
                >
                    {/* Email Input */}
                    <label className="block mb-4">
                        <span className="text-gray-700">Email</span>
                        <input
                            style={{ borderColor: "#A03048" }}
                            type="email"
                            name="email"
                            value={user.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border p-2 rounded"
                            required
                        />
                    </label>

                    {/* Password Input */}
                    <label className="block mb-4">
                        <span className="text-gray-700">Password</span>
                        <input
                            style={{ borderColor: "#A03048" }}
                            type="password"
                            name="password"
                            value={user.password}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border p-2 rounded"
                            required
                        />
                    </label>

                    {/* Login Button */}
                    <button
                        style={{ backgroundColor: "#A03048" }}
                        type="submit"
                        disabled={buttonDisabled || loading}
                        className={`text-white w-full py-2 rounded mt-4 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                        {loading ? "Logging in..." : "Log In"}
                    </button>

                    {/* Google Login */}
                    <button
                        onClick={() => signIn("google")}
                        style={{ backgroundColor: "#A03048" }}
                        type="button"
                        className="text-white w-full py-2 rounded mt-4"
                    >
                        Login with Google
                    </button>

                    {/* Forgot Password */}
                    <button
                        type="button"
                        style={{ borderColor: "#A03048" }}
                        className="border w-full py-2 rounded mt-2"
                    >
                        Forgot Password?
                    </button>

                    {/* Create Account */}
                    <button
                        type="button"
                        className="border border-gray-400 text-gray-500 w-full py-2 rounded mt-4"
                        onClick={() => router.push("/sign-up")}
                    >
                        New User? Create an Account
                    </button>
                </form>
            </div>
        </div>
    );
}
