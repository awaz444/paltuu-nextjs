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

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    try {
      console.log("Submitting vet registration with data:", formData);

      // Call the combined registration API
      const response = await fetch("/api/v1/vet-register-complete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Step 0: Account data
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
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
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to complete registration");
      }

      const result = await response.json();
      console.log("Registration successful:", result);

      toast.success("Registration completed successfully!");
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

  const renderStep = () => {
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
            onComplete={handleCompleteRegistration}
            isSubmitting={isSubmitting}
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