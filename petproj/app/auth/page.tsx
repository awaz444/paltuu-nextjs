// app/auth/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";

// Create a client component that uses useSearchParams
function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as "login" | "signup" | null;
  const [authMode, setAuthMode] = useState<"login" | "signup">(
    initialMode === "signup" ? "signup" : "login"
  );

  const handleBackToHome = () => {
    router.push("/");
  };

  const switchToSignup = () => setAuthMode("signup");
  const switchToLogin = () => setAuthMode("login");

  return (
    <div className="min-h-screen flex flex-col sm:flex-col lg:flex-row bg-gray-100">
      {/* Left Side - Branding */}
      <div className="w-full lg:w-1/2 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none lg:h-screen lg:overflow-hidden">
        <button
          onClick={handleBackToHome}
          className="absolute top-4 left-4 text-white hover:text-gray-200 flex items-center transition-colors"
          title="Back to Home"
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
          Back to Main Page
        </button>

        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-3 mt-2 w-40 lg:w-full max-w-full"
        />
        
      </div>

      {/* Right Side - Auth Forms */}
<div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-6 sm:p-12 bg-gray-100 h-screen overflow-hidden">
        <div className="w-full max-w-md">
          {/* Dynamic Form Rendering */}
          {authMode === "login" ? (
            <LoginForm 
              onSwitchToSignup={switchToSignup}
            />
          ) : (
            <SignupForm 
              onSwitchToLogin={switchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Create the main page component with Suspense
export default function AuthPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="animate-pulse text-primary">Loading...</div>
        </div>
      }
    >
      <AuthPageClient />
    </Suspense>
  );
}