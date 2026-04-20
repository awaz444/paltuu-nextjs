"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import PartnerModal from "./PartnerModal";

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();

  const [user, setUser] = useState({ email: "", password: "" });
  const [buttonDisabled, setButtonDisabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPartnerModal, setShowPartnerModal] = useState(false);

  // Floating label states
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  // Redirect handled by AuthContext after login

  const redirectBasedOnRole = (role: string) => {
    if (role === "vet") router.push("/vet-panel");
    else if (role === "shop admin") router.push("/shop-panel");
    else if (role === "shelter admin") router.push("/rescue-panel");
    else router.push("/browse-pets");
  };

  useEffect(() => {
    setButtonDisabled(!(user.email && user.password));
  }, [user]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post("/api/v1/auth/login", user, {
        withCredentials: true,
      });
      if (response.data.success) {
        const { user_id, name, email, role, profile_image_url } = response.data.user;
        const userDetails = {
          id: user_id,
          name,
          email,
          role,
          profile_image_url: profile_image_url || "/default-avatar.png",
        };
        // Token is set in httpOnly cookie by server, no localStorage needed
        login(userDetails); // This will update AuthContext and redirect
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
      <h2 className="text-2xl font-semibold text-center mb-4">Welcome Back!</h2>

      {/* Floating Email */}
      <div className="relative mb-6">
        <input
          id="email"
          type="email"
          name="email"
          value={user.email}
          onChange={(e) => setUser({ ...user, email: e.target.value })}
          onFocus={() => setIsEmailFocused(true)}
          onBlur={() => setIsEmailFocused(false)}
          className="w-full border border-gray-300 rounded-xl px-4 pt-4 pb-3 text-sm text-gray-800 focus:border-2 focus:border-primary focus:ring-0 outline-none transition-all"
          placeholder=" "
          required
        />
        <label
          htmlFor="email"
          className={`absolute left-4 text-gray-500 text-sm transition-all duration-200 ${isEmailFocused || user.email
            ? "-top-2 text-xs text-primary bg-white px-1 pointer-events-none"
            : "top-4 text-gray-400"
            }`}
        >
          Email
        </label>
      </div>

      {/* Floating Password */}
      <div className="relative mb-6">
        <input
          id="password"
          type={showPassword ? "text" : "password"}
          name="password"
          value={user.password}
          onChange={(e) => setUser({ ...user, password: e.target.value })}
          onFocus={() => setIsPasswordFocused(true)}
          onBlur={() => setIsPasswordFocused(false)}
          className="w-full border border-gray-300 rounded-xl px-4 pt-4 pb-3 text-sm text-gray-800 focus:border-2 focus:border-primary focus:ring-0 outline-none transition-all pr-10"
          placeholder=" "
          required
        />
        <label
          htmlFor="password"
          className={`absolute left-4 text-gray-500 text-sm transition-all duration-200 ${isPasswordFocused || user.password
            ? "-top-2 text-xs text-primary bg-white px-1 pointer-events-none"
            : "top-4 text-gray-400"
            }`}
        >
          Password
        </label>

        {/* Eye toggle */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showPassword ? (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fillRule="evenodd"
                d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
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

      {/* Login Button */}
      <button
        type="submit"
        disabled={buttonDisabled || loading}
        className={`w-full py-3 px-4 rounded-xl text-white bg-primary hover:bg-primary transition font-medium ${buttonDisabled || loading ? "opacity-50 cursor-not-allowed" : ""
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
        className={`w-full py-3 px-4 rounded-xl text-gray-600 border border-gray-400 hover:border-primary hover:text-primary transition flex items-center justify-center space-x-2 font-medium ${googleLoading ? "opacity-50 cursor-not-allowed" : ""
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

      {/* Forgot Password */}
      <div className="mt-4 mb-3 text-right">
        <button
          type="button"
          className="text-primary hover:underline text-sm focus:outline-none"
          onClick={() => router.push("/forgot-password")}
        >
          Forgot Password?
        </button>
      </div>

      {/* Signup + Partner */}
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

      <div className="pt-4 text-center">
        <p className="text-sm text-gray-600">
          Are you a vet, clinic, or rescue?{" "}
          <button
            type="button"
            className="text-primary font-semibold hover:underline focus:outline-none"
            onClick={() => setShowPartnerModal(true)}
          >
            Contact us
          </button>
        </p>
      </div>

      <PartnerModal
        visible={showPartnerModal}
        onClose={() => setShowPartnerModal(false)}
      />
    </form>
  );
}