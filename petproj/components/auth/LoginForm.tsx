// components/auth/LoginForm.tsx
"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState({
    email: "",
    password: "",
  });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Redirect based on role if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const { role } = JSON.parse(storedUser);
        redirectBasedOnRole(role);
      }
    }
  }, [isAuthenticated, router]);

  const redirectBasedOnRole = (role: string) => {
    if (role === "vet") router.push("/vet-panel");
    else if (role === "shop admin") router.push("/shop-panel");
    else if (role === "shelter admin") router.push("/rescue-panel");
    else router.push("/browse-pets");
  };

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post("/api/users/login", user);

      if (response.data.success) {
        const { user_id, name, email, role, profile_image_url } =
          response.data.user;

        const userDetails = {
          id: user_id,
          name,
          email,
          role,
          profile_image_url: profile_image_url || "/default-avatar.png",
        };

        localStorage.setItem("user", JSON.stringify(userDetails));
        login(userDetails);

        toast.success("Login successful!");
      }
    } catch (error: any) {
      console.error("Login failed:", error.message);
      toast.error(error.response?.data?.message || "Login failed!");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await signIn("google");
    } catch (error) {
      console.error("Google login failed:", error);
      toast.error("Google login failed. Please try again!");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin} className="bg-white shadow-lg rounded-2xl p-6">
            <h2 className="text-2xl font-semibold text-center mb-2">Welcome Back!</h2>

      {/* Email Input */}
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Email
        </label>
        <input
          placeholder="Enter your email"
          type="email"
          name="email"
          value={user.email}
          onChange={handleInputChange}
          className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          required
        />
      </div>

      {/* Password Input */}
      <div className="mb-6 relative">
        <label className="block text-gray-700 text-sm font-medium mb-2">
          Password
        </label>
        <div className="relative">
          <input
            placeholder="Enter your password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={user.password}
            onChange={handleInputChange}
            className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none pr-10"
            required
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fillRule="evenodd"
                  d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                  clipRule="evenodd"
                />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Forgot Password */}
      <div className="mb-4 text-right">
        <button
          type="button"
          className="text-primary hover:underline text-sm focus:outline-none"
          onClick={() => router.push("/forgot-password")}
        >
          Forgot Password?
        </button>
      </div>

      {/* Login Button */}
      <button
        type="submit"
        disabled={buttonDisabled || loading}
        className={`w-full py-3 px-4 rounded-xl text-white bg-primary hover:bg-primary transition font-medium ${
          buttonDisabled || loading ? "opacity-50" : ""
        }`}
      >
        {loading ? "Signing In..." : "Sign In"}
      </button>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">or continue with</span>
        </div>
      </div>

      {/* Google Login */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading}
        className={`w-full py-3 px-4 rounded-xl text-gray-600 border border-gray-400 hover:border-primary hover:text-primary transition flex items-center justify-center space-x-2 font-medium mb-6 ${
          googleLoading ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
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
        <span>{googleLoading ? "Signing In..." : "Google"}</span>
      </button>

      {/* Switch to Signup - Simple text link */}
      <div className="text-center border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline focus:outline-none"
            onClick={onSwitchToSignup}
          >
            Create one
          </button>
        </p>
      </div>

      {/* Partner Program */}
      <div className="pt-4  text-center">
        <p className="text-sm text-gray-600">
          Veterinary professional, pet shop owner, or rescue organization?{" "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline focus:outline-none"
            onClick={() => router.push("/partner-signup")}
          >
            Join our Partner Program
          </button>
        </p>
      </div>
    </form>
  );
}