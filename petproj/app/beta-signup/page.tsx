"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";

type Platform = "ios" | "android";
type Step = "platform" | "email" | "success";

export default function BetaSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("platform");
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [email, setEmail] = useState("");
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBackToHome = () => {
    router.push("/");
  };

  const handlePlatformSelect = (selected: Platform) => {
    setPlatform(selected);
    setStep("email");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform) return;

    try {
      setLoading(true);
      await axios.post("/api/v1/beta-signup", { email, platform });
      setStep("success");
    } catch (error: any) {
      console.error("Beta signup failed:", error.message);
      toast.error(error.response?.data?.error || "Something went wrong, please try again!");
    } finally {
      setLoading(false);
    }
  };

  const platformLabel = platform === "ios" ? "iOS" : "Android";

  return (
    <div className="min-h-screen flex flex-col sm:flex-col lg:flex-row bg-gray-100">
      {/* Left Panel */}
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
        </button>

        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-3 mt-2 w-40 lg:w-full max-w-full"
        />
        <p className="hidden lg:block text-center text-white/90 max-w-sm mt-4 px-4">
          Be among the first to try the Paltuu app and help us shape it before launch.
        </p>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 lg:ml-[50%] flex items-center justify-center p-6 sm:p-12 bg-gray-100 lg:min-h-screen py-10">
        <div className="w-full max-w-md">
          {step === "platform" && (
            <div className="bg-white shadow-lg rounded-2xl p-6">
              <h2 className="text-2xl font-semibold text-center mb-2">
                Join the Beta Program
              </h2>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Select your device to get started
              </p>

              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => handlePlatformSelect("ios")}
                  className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-gray-50 transition-all flex items-center text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 shrink-0">
                    <svg className="h-6 w-6 text-gray-800" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M16.365 1.43c0 1.14-.463 2.205-1.247 3.011-.847.87-2.217 1.534-3.385 1.44-.146-1.113.404-2.28 1.196-3.075C13.91 1.78 15.205 1.13 16.365 1.43zM20.82 17.19c-.56 1.29-.825 1.86-1.545 3-.95 1.45-2.29 3.25-3.95 3.27-1.48.02-1.86-.96-3.87-.95-2.01.01-2.43.97-3.91.95-1.66-.02-2.93-1.65-3.88-3.1-2.66-4.05-2.94-8.8-1.3-11.3 1.16-1.78 3-2.83 4.72-2.83 1.76 0 2.87 1 4.33 1 1.41 0 2.27-1.01 4.29-1.01 1.53 0 3.15.83 4.3 2.27-3.78 2.08-3.17 7.5.81 8.7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">iOS</h3>
                    <p className="text-sm text-gray-500">iPhone via TestFlight</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePlatformSelect("android")}
                  className="w-full p-5 rounded-xl border-2 border-gray-200 hover:border-primary hover:bg-gray-50 transition-all flex items-center text-left"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4 shrink-0">
                    <svg className="h-6 w-6 text-green-600" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M17.523 15.34c-.5 0-.906-.406-.906-.906 0-.5.406-.906.906-.906.5 0 .906.406.906.906 0 .5-.406.906-.906.906m-11.046 0c-.5 0-.906-.406-.906-.906 0-.5.406-.906.906-.906.5 0 .906.406.906.906 0 .5-.406.906-.906.906m11.405-6.02l1.814-3.142a.377.377 0 00-.138-.515.377.377 0 00-.515.138l-1.837 3.181a11.19 11.19 0 00-4.706-1.02c-1.685 0-3.28.37-4.706 1.02L5.957 5.801a.377.377 0 00-.515-.138.377.377 0 00-.138.515l1.814 3.142C3.76 10.94 1.5 14.28 1.5 18.1h21c0-3.82-2.26-7.16-5.618-8.78" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Android</h3>
                    <p className="text-sm text-gray-500">via Google Play beta</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === "email" && platform && (
            <form onSubmit={handleSubmit} className="bg-white shadow-lg rounded-2xl p-6">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="text-gray-400 hover:text-gray-600 flex items-center text-sm mb-4"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>

              <h2 className="text-2xl font-semibold text-center mb-2">
                Almost there!
              </h2>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Enter your email and we'll send you {platformLabel} beta access
              </p>

              <div className="relative mb-6">
                <input
                  id="email"
                  type="email"
                  name="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  className="w-full border border-gray-300 rounded-xl px-4 pt-4 pb-3 text-sm text-gray-800 focus:border-2 focus:border-primary focus:ring-0 outline-none transition-all"
                  placeholder=" "
                  required
                />
                <label
                  htmlFor="email"
                  className={`absolute left-4 text-gray-500 text-sm transition-all duration-200 ${
                    isEmailFocused || email
                      ? "-top-2 text-xs text-primary bg-white px-1 pointer-events-none"
                      : "top-4 text-gray-400"
                  }`}
                >
                  Email Address
                </label>
              </div>

              <button
                type="submit"
                disabled={!email || loading}
                className={`w-full py-3 px-4 rounded-xl text-white bg-primary hover:bg-primary transition font-medium ${
                  !email || loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Submitting..." : "Notify Me"}
              </button>
            </form>
          )}

          {step === "success" && (
            <div className="bg-white shadow-lg rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Thank you!</h2>
              <p className="text-gray-600 text-sm leading-relaxed mb-6">
                You're on the {platformLabel} beta list. We'll send an email to{" "}
                <span className="font-medium text-gray-800">{email}</span> with instructions to
                get access once you're approved.
              </p>
              <button
                type="button"
                onClick={handleBackToHome}
                className="text-primary font-semibold hover:underline focus:outline-none text-sm"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
