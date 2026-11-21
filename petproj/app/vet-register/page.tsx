"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import StepZero_Account from "./steps/StepZero_Account";
import StepOne_Profile from "./steps/StepOne_Profile";
import StepTwo_Qualifications from "./steps/StepTwo_Qualifications";
import StepThree_Specializations from "./steps/StepThree_Specializations";
import StepFour_Schedule from "./steps/StepFour_Schedule";
import { toast } from "react-hot-toast";
import { MoonLoader } from "react-spinners";

interface FormData {
  // Step 0 - Account
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  city: string;
  user_id?: number;

  // Step 1 - Profile
  clinicName: string;
  clinicLocation: string;
  consultationFee: string;
  contactNumber: string;
  bio: string;
  imageUrl: string;
  vet_id?: number;

  // Step 2 - Qualifications
  selectedQualifications: number[];
  qualificationDetails: {
    [key: number]: {
      yearAcquired: string;
      note: string;
    };
  };

  // Step 3 - Specializations
  selectedCategories: number[];

  // Step 4 - Schedule
  schedules: Array<{
    day: string;
    startTime: string;
    endTime: string;
  }>;
}

const VetRegisterContent = () => {
  const router = useRouter();
  
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#000000");
  // After the last step we email a 6-digit code and the vet enters it here,
  // as the normal signup does. Sent at the end, not after step 1, because the
  // code expires in 10 minutes.
  const [verifying, setVerifying] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");

  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    city: "",
    clinicName: "",
    clinicLocation: "",
    consultationFee: "",
    contactNumber: "",
    bio: "",
    imageUrl: "",
    selectedQualifications: [],
    qualificationDetails: {},
    selectedCategories: [],
    schedules: [{ day: "", startTime: "", endTime: "" }],
  });

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }
  }, []);

  const next = () => setStep((prev) => Math.min(prev + 1, 4));
  const back = () => setStep((prev) => Math.max(prev - 1, 0));

  const email = formData.email.trim().toLowerCase();

  const sendCode = async () => {
    setSendingCode(true);
    setOtpError("");
    try {
      const response = await fetch("/api/v1/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "We couldn't send the code. Please try again.");
      }
      setOtp("");
      setVerifying(true);
      toast.success(`We sent a 6-digit code to ${email}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We couldn't send the code. Please try again.");
    } finally {
      setSendingCode(false);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }
    setOtpError("");
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/v1/vet-register-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          otp,
          // Step 0: Account data
          firstName: formData.firstName,
          lastName: formData.lastName,
          email,
          password: formData.password,
          phoneNumber: formData.phoneNumber,
          city: formData.city,
          
          // Step 1: Profile data
          clinicName: formData.clinicName,
          clinicLocation: formData.clinicLocation,
          consultationFee: formData.consultationFee,
          contactNumber: formData.contactNumber,
          bio: formData.bio,
          imageUrl: formData.imageUrl,
          
          // Step 2: Qualifications data
          selectedQualifications: formData.selectedQualifications,
          qualificationDetails: formData.qualificationDetails,
          
          // Step 3: Specializations data
          selectedCategories: formData.selectedCategories,
          
          // Step 4: Schedule data
          schedules: formData.schedules,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error === "INVALID_CODE" || errorData.error === "CODE_EXPIRED") {
          setOtpError(errorData.message);
          return;
        }
        if (errorData.error === "EMAIL_EXISTS") {
          setVerifying(false);
          setStep(0);
        }
        throw new Error(errorData.message || "Failed to complete registration");
      }

      toast.success("Application submitted!");
      router.push("/vet-process-complete");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCodeEntry = () => (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Verify Your Email</h2>
      <p className="text-gray-600 text-center">
        Enter the 6-digit code we sent to <b className="break-all">{email}</b>. It expires in 10 minutes.
      </p>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={otp}
        onChange={(e) => {
          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
          setOtpError("");
        }}
        placeholder="000000"
        aria-label="6-digit code"
        className="w-full border border-gray-300 rounded-xl px-3 py-3 text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-primary focus:outline-none"
      />
      {otpError && <p className="text-red-500 text-xs text-center">{otpError}</p>}
      <button
        onClick={handleCompleteRegistration}
        className="w-full bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors">
        Submit Application
      </button>
      <div className="flex justify-between text-sm">
        <button type="button" onClick={() => setVerifying(false)} className="text-gray-600 hover:underline">
          Back
        </button>
        <button
          type="button"
          onClick={sendCode}
          disabled={sendingCode}
          className="text-primary font-semibold hover:underline disabled:opacity-50">
          {sendingCode ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );

  const renderStep = () => {
    if (verifying) return renderCodeEntry();
    switch (step) {
      case 0:
        return (
          <StepZero_Account
            formData={formData}
            setFormData={setFormData}
            next={next}
          />
        );
      case 1:
        return (
          <StepOne_Profile
            formData={formData}
            setFormData={setFormData}
            next={next}
            back={back}
          />
        );
      case 2:
        return (
          <StepTwo_Qualifications
            formData={formData}
            setFormData={setFormData}
            next={next}
            back={back}
          />
        );
      case 3:
        return (
          <StepThree_Specializations
            formData={formData}
            setFormData={setFormData}
            next={next}
            back={back}
          />
        );
      case 4:
        return (
          <StepFour_Schedule
            formData={formData}
            setFormData={setFormData}
            back={back}
            onComplete={sendCode}
            isSubmitting={sendingCode}
          />
        );
      default:
        return (
          <StepZero_Account
            formData={formData}
            setFormData={setFormData}
            next={next}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left side static - becomes header on mobile */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center bg-primary p-4 lg:p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none lg:sticky lg:top-0 lg:h-screen">
        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-4 lg:mb-6 w-1/2 lg:w-3/4 max-w-xs lg:max-w-md"
        />
        <div className="text-center mt-2 lg:mt-4">
          <h2 className="text-xl lg:text-2xl font-bold mb-2">
            Veterinarian Registration
          </h2>
          <p className="text-sm lg:text-lg">Step {step + 1} of 5</p>
          <div className="w-full bg-gray-400 rounded-full h-2.5 mt-2 lg:mt-4">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${((step + 1) / 5) * 100}%`,
              }}></div>
          </div>
        </div>
      </div>

      {/* Right side dynamic form */}
      <div className="w-full lg:w-1/2 bg-gray-100 flex flex-col items-center justify-start px-4 py-8 lg:px-8 lg:py-12 lg:h-screen lg:overflow-y-auto">
        {isSubmitting ? (
          <div className="flex flex-col items-center justify-center">
            <MoonLoader size={30} color={primaryColor} />
            <p className="mt-4">Completing your registration...</p>
          </div>
        ) : (
          renderStep()
        )}
      </div>
    </div>
  );
};

const VetRegister = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <MoonLoader size={50} color="#3B82F6" />
        </div>
      }>
      <VetRegisterContent />
    </Suspense>
  );
};

export default VetRegister;