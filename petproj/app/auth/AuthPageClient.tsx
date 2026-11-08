"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import LoginForm from "@/components/auth/LoginForm";
import SignupForm from "@/components/auth/SignupForm";
import { safeCallbackUrl } from "@/lib/authRedirect";

function AuthPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") as "login" | "signup" | null;
  const [authMode, setAuthMode] = useState<"login" | "signup">(
    initialMode === "signup" ? "signup" : "login"
  );

  // Sent here from a page (e.g. a pet's contact): back goes there, not home.
  const returnTo = safeCallbackUrl(searchParams.get("callbackUrl"));
  const handleBackToHome = () => {
    router.push(returnTo ?? "/");
  };

  const switchToSignup = () => setAuthMode("signup");
  const switchToLogin = () => setAuthMode("login");

  return (
    <div className="min-h-screen flex flex-col sm:flex-col lg:flex-row bg-gray-100">
      <div className="w-full lg:w-1/2 lg:fixed lg:left-0 lg:top-0 lg:bottom-0 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none lg:h-screen lg:overflow-hidden">
        <button
          onClick={handleBackToHome}
          className="absolute top-4 left-4 text-white hover:text-gray-200 flex items-center transition-colors"
          title={returnTo ? "Back" : "Back to Home"}
          aria-label={returnTo ? "Back" : "Back to Home"}
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

        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-3 mt-2 w-40 lg:w-full max-w-full"
        />
      </div>

      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-6 sm:p-12 bg-gray-100 lg:min-h-screen py-10">
        <div className="w-full max-w-md">
          {returnTo && (
            <p className="mb-4 rounded-xl bg-white px-4 py-3 text-center text-sm text-gray-700 shadow-sm">
              {authMode === "login" ? "Log in" : "Create a free account"} to continue. We&apos;ll take you right back.
            </p>
          )}
          {authMode === "login" ? (
            <LoginForm onSwitchToSignup={switchToSignup} />
          ) : (
            <SignupForm onSwitchToLogin={switchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPageClientWrapper() {
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
