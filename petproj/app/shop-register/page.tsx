"use client";
import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import StepZero from "./steps/StepZero_Account";
import StepOne from "./steps/StepOne_Profile";
import StepTwo from "./steps/StepTwo_Socials";
import StepThree from "./steps/StepThree_Review";
import { toast } from "react-hot-toast";
import { MoonLoader } from "react-spinners";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/app/store/store";
import { fetchCities } from "@/app/store/slices/citiesSlice";

interface FormData {
  // User account fields
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  phone_number: string;
  city_id: number | null;

  // Shop fields
  shopName: string;
  address: string;
  logo: File | null;
  accountTitle: string;
  iban: string;
  bankName: string;
  socials: {
    instagram: string;
    facebook: string;
    website: string;
  };
}

const ShopRegisterContent = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const { cities } = useSelector((state: RootState) => state.cities);

  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [primaryColor, setPrimaryColor] = useState("#000000");

  const [formData, setFormData] = useState<FormData>({
    // User account fields
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    phone_number: "",
    city_id: null,

    // Shop fields
    shopName: "",
    address: "",
    logo: null,
    accountTitle: "",
    iban: "",
    bankName: "",
    socials: {
      instagram: "",
      facebook: "",
      website: "",
    },
  });

  useEffect(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const color = rootStyles.getPropertyValue("--primary-color").trim();
    if (color) {
      setPrimaryColor(color);
    }

    // Fetch cities for the form
    dispatch(fetchCities());
  }, [dispatch]);

  const next = () => setStep((prev) => Math.min(prev + 1, 3));
  const back = () => setStep((prev) => Math.max(prev - 1, 0));

  const handleCompleteRegistration = async () => {
    setIsSubmitting(true);
    try {
      // Create FormData object
      const formDataToSend = new FormData();

      // Append all non-file fields as JSON
      formDataToSend.append(
        "data",
        JSON.stringify({
          // User data
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone_number: formData.phone_number,
          city_id: formData.city_id,
          role: "shop admin",

          // Shop data
          shopName: formData.shopName,
          address: formData.address,
          accountTitle: formData.accountTitle,
          iban: formData.iban,
          bankName: formData.bankName,
          socials: formData.socials,
        })
      );

      // Append logo file
      if (formData.logo) {
        formDataToSend.append("logo", formData.logo);
      }

      console.log("Submitting shop registration with data:", formDataToSend);

      // Make API call to create both user and shop
      const response = await fetch("/api/shops/complete-registration", {
        method: "POST",
        body: formDataToSend,
      });

      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to submit registration"
        );
      }

      const result = await response.json();

      if (result.success) {
        toast.success("Shop registration completed successfully!");
        // Redirect to login or dashboard
        router.push("/login");
      } else {
        throw new Error(result.error || "Registration failed");
      }
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
          <StepZero
            data={{
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              name: formData.name,
              phone_number: formData.phone_number,
              city_id: formData.city_id,
            }}
            setData={(updatedData) =>
              setFormData((prev) => ({ ...prev, ...updatedData }))
            }
            next={next}
            cities={cities}
          />
        );
      case 1:
        return (
          <StepOne
            data={{
              shopName: formData.shopName,
              address: formData.address,
              logo: formData.logo,
            }}
            setData={(updatedData) =>
              setFormData((prev) => ({ ...prev, ...updatedData }))
            }
            next={next}
            back={back}
          />
        );
      case 2:
        return (
          <StepTwo
            data={{
              accountTitle: formData.accountTitle,
              iban: formData.iban,
              bankName: formData.bankName,
              socials: formData.socials,
            }}
            setData={(updatedData) =>
              setFormData((prev) => ({ ...prev, ...updatedData }))
            }
            next={next}
            back={back}
          />
        );
      case 3:
        return (
          <StepThree
            data={formData}
            cities={cities}
            back={back}
            onSubmit={handleCompleteRegistration}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return (
          <StepZero
            data={{
              email: formData.email,
              password: formData.password,
              confirmPassword: formData.confirmPassword,
              name: formData.name,
              phone_number: formData.phone_number,
              city_id: formData.city_id,
            }}
            setData={(updatedData) =>
              setFormData((prev) => ({ ...prev, ...updatedData }))
            }
            next={next}
            cities={cities}
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
            Shop Registration
          </h2>
          <p className="text-sm lg:text-lg">Step {step + 1} of 4</p>
          <div className="w-full bg-gray-400 rounded-full h-2.5 mt-2 lg:mt-4">
            <div
              className="bg-white h-2.5 rounded-full transition-all duration-300"
              style={{
                width: `${((step + 1) / 4) * 100}%`,
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

const ShopRegister = () => {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <MoonLoader size={50} color="#3B82F6" />
        </div>
      }>
      <ShopRegisterContent />
    </Suspense>
  );
};

export default ShopRegister;