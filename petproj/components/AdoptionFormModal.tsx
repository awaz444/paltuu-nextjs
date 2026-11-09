"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import PhoneNumberInput from "./PhoneNumberInput";
import { isValidPhone, normalizePhone } from "@/utils/phone";
import { Modal, Field, inputClass, inputErrorClass, CheckRow, StepBar, btn } from "./account/ui";

interface City {
    city_id: number;
    city_name: string;
}

export interface AdoptionFormInitialValues {
    adopter_name?: string;
    contact_number?: string;
    city_id?: number | string;
}

interface AdoptionFormProps {
    petId: number;
    userId: string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
    /** Shown in the title: "Apply to adopt Bruno". */
    petName?: string;
    /** Filled in from the adopter's profile when the modal opens, without overwriting typed answers. */
    initialValues?: AdoptionFormInitialValues;
}

const EMPTY_FORM = {
    adopter_name: "",
    city_id: "",
    contact_number: "",
    adopter_address: "",
    age_of_youngest_child: "",
    other_pets_details: "",
    other_pets_neutered: false,
    has_secure_outdoor_area: false,
    pet_sleep_location: "",
    pet_left_alone: "",
    additional_details: "",
    agree_to_terms: false,
};

const STEPS = ["About you", "Your home", "Last details"];

const AdoptionFormModal: React.FC<AdoptionFormProps> = ({
    petId,
    userId,
    visible,
    onClose,
    onSubmit,
    petName,
    initialValues,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    const [submitted, setSubmitted] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ ...EMPTY_FORM });

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const res = await fetch("/api/v1/cities");
                if (res.ok) {
                    const data = await res.json();
                    setCities(data);
                }
            } catch (err) {
                console.error("Error fetching cities:", err);
            }
        };
        if (visible) fetchCities();
    }, [visible]);

    // Prefill from the profile once per opening, only into fields still empty.
    const prefilledRef = useRef(false);
    useEffect(() => {
        if (!visible) {
            prefilledRef.current = false;
            setSubmitted(false);
            return;
        }
        if (prefilledRef.current || !initialValues) return;
        prefilledRef.current = true;
        const phone = initialValues.contact_number ? normalizePhone(initialValues.contact_number) ?? "" : "";
        const city = initialValues.city_id != null && initialValues.city_id !== "" ? String(initialValues.city_id) : "";
        setFormData((prev) => ({
            ...prev,
            adopter_name: prev.adopter_name || (initialValues.adopter_name ?? "").trim(),
            contact_number: prev.contact_number || phone,
            city_id: prev.city_id || city,
        }));
    }, [visible, initialValues]);

    const clearError = (name: string) => {
        if (formErrors[name]) {
            setFormErrors((prev) => {
                const next = { ...prev };
                delete next[name];
                return next;
            });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        clearError(name);
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData((prev) => ({ ...prev, [name]: checked }));
        clearError(name);
    };

    const validateStep = (step: number) => {
        const errors: Record<string, string> = {};
        if (step === 1) {
            if (!formData.adopter_name) errors.adopter_name = "Name is required";
            if (!formData.city_id) errors.city_id = "City is required";
            if (!formData.contact_number) {
                errors.contact_number = "Phone number is required";
            } else if (!isValidPhone(formData.contact_number)) {
                errors.contact_number = "Enter a valid phone number for the selected country";
            }
            if (!formData.adopter_address) errors.adopter_address = "Address is required";
        } else if (step === 3) {
            if (!formData.agree_to_terms) errors.agree_to_terms = "You must agree to the terms";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep((prev) => prev - 1);
    };

    const handleFormSubmit = async () => {
        if (!validateStep(currentStep)) return;

        try {
            setLoading(true);
            const payload = {
                user_id: userId,
                pet_id: petId,
                ...formData,
                city_id: parseInt(formData.city_id),
                contact_number: formData.contact_number,
            };

            const response = await fetch("/api/v1/applications/adoption", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                onSubmit(result);
                setCurrentStep(1);
                setFormData({ ...EMPTY_FORM });
                setSubmitted(true);
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to submit form");
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const fieldClass = (name: string, extra = "h-11") =>
        `${inputClass} ${extra} ${formErrors[name] ? inputErrorClass : ""}`;

    const footer = submitted ? (
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} className={`${btn.secondary} w-full sm:w-auto`}>
                Done
            </button>
            <Link href="/my-applications" onClick={onClose} className={`${btn.primary} w-full sm:w-auto`}>
                See my applications
            </Link>
        </div>
    ) : (
        <div className="flex gap-2 sm:justify-end">
            {currentStep > 1 && (
                <button type="button" onClick={handleBack} disabled={loading} className={`${btn.secondary} flex-1 sm:flex-none`}>
                    <ArrowLeft size={16} />
                    Back
                </button>
            )}
            {currentStep < STEPS.length ? (
                <button type="button" onClick={handleNext} className={`${btn.primary} flex-1 sm:flex-none`}>
                    Next
                    <ArrowRight size={16} />
                </button>
            ) : (
                <button type="button" onClick={handleFormSubmit} disabled={loading} className={`${btn.primary} flex-1 sm:flex-none`}>
                    {loading ? "Sending…" : "Submit application"}
                </button>
            )}
        </div>
    );

    return (
        <Modal
            open={visible}
            onClose={onClose}
            size="lg"
            scrollKey={submitted ? "done" : currentStep}
            closeDisabled={loading}
            title={petName ? `Apply to adopt ${petName}` : "Apply to adopt"}
            subtitle={submitted ? undefined : "The owner reads this before replying. It takes about two minutes."}
            footer={footer}>
            {submitted ? (
                <div className="flex flex-col items-center py-6 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 text-green-600">
                        <CheckCircle2 size={24} />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">Application sent</h3>
                    <p className="mt-1 max-w-sm text-sm text-gray-600">
                        We&apos;ve sent your answers to the owner. You&apos;ll get a notification when they reply.
                    </p>
                </div>
            ) : (
                <>
                    <StepBar step={currentStep} total={STEPS.length} label={STEPS[currentStep - 1]} />

                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            transition={{ duration: 0.15 }}
                            className="mt-5 space-y-4">
                            {currentStep === 1 && (
                                <>
                                    <Field label="Full name" required error={formErrors.adopter_name} htmlFor="adopt-name">
                                        <input
                                            id="adopt-name"
                                            type="text"
                                            name="adopter_name"
                                            autoComplete="name"
                                            className={fieldClass("adopter_name")}
                                            placeholder="Your full name"
                                            value={formData.adopter_name}
                                            onChange={handleChange}
                                        />
                                    </Field>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field label="City" required error={formErrors.city_id} htmlFor="adopt-city">
                                            <select
                                                id="adopt-city"
                                                name="city_id"
                                                className={fieldClass("city_id")}
                                                value={formData.city_id}
                                                onChange={handleChange}>
                                                <option value="">Select city</option>
                                                {cities.map((city) => (
                                                    <option key={city.city_id} value={city.city_id}>
                                                        {city.city_name}
                                                    </option>
                                                ))}
                                            </select>
                                        </Field>
                                        <Field label="Phone number" required error={formErrors.contact_number} htmlFor="adopt-phone">
                                            <PhoneNumberInput
                                                id="adopt-phone"
                                                value={formData.contact_number}
                                                onChange={(e164) => {
                                                    setFormData((prev) => ({ ...prev, contact_number: e164 }));
                                                    clearError("contact_number");
                                                }}
                                                hasError={!!formErrors.contact_number}
                                                className={`${inputClass} flex h-11 items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-tint ${
                                                    formErrors.contact_number ? inputErrorClass : ""
                                                }`}
                                                inputClassName="!font-normal"
                                            />
                                        </Field>
                                    </div>

                                    <Field
                                        label="Area or address"
                                        required
                                        hint="Your neighbourhood is enough."
                                        error={formErrors.adopter_address}
                                        htmlFor="adopt-address">
                                        <textarea
                                            id="adopt-address"
                                            name="adopter_address"
                                            rows={2}
                                            className={`${fieldClass("adopter_address", "py-2.5")} resize-none`}
                                            placeholder="e.g. DHA Phase 5"
                                            value={formData.adopter_address}
                                            onChange={handleChange}
                                        />
                                    </Field>
                                </>
                            )}

                            {currentStep === 2 && (
                                <>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <Field label="Age of your youngest child" hint="Leave empty if there are no children." htmlFor="adopt-child">
                                            <input
                                                id="adopt-child"
                                                type="number"
                                                min={0}
                                                name="age_of_youngest_child"
                                                className={fieldClass("age_of_youngest_child")}
                                                placeholder="Age in years"
                                                value={formData.age_of_youngest_child}
                                                onChange={handleChange}
                                            />
                                        </Field>
                                        <Field label="Where will the pet sleep?" htmlFor="adopt-sleep">
                                            <input
                                                id="adopt-sleep"
                                                type="text"
                                                name="pet_sleep_location"
                                                className={fieldClass("pet_sleep_location")}
                                                placeholder="e.g. Indoors, in the living room"
                                                value={formData.pet_sleep_location}
                                                onChange={handleChange}
                                            />
                                        </Field>
                                    </div>

                                    <Field label="Other pets at home" htmlFor="adopt-pets">
                                        <textarea
                                            id="adopt-pets"
                                            name="other_pets_details"
                                            rows={2}
                                            className={`${fieldClass("other_pets_details", "py-2.5")} resize-none`}
                                            placeholder="e.g. One 3-year-old cat"
                                            value={formData.other_pets_details}
                                            onChange={handleChange}
                                        />
                                    </Field>

                                    <div className="space-y-2">
                                        <CheckRow
                                            checked={formData.other_pets_neutered}
                                            onChange={(v) => handleCheckboxChange("other_pets_neutered", v)}
                                            label="Your other pets are neutered or spayed"
                                        />
                                        <CheckRow
                                            checked={formData.has_secure_outdoor_area}
                                            onChange={(v) => handleCheckboxChange("has_secure_outdoor_area", v)}
                                            label="You have a secure outdoor area"
                                        />
                                    </div>
                                </>
                            )}

                            {currentStep === 3 && (
                                <>
                                    <Field label="How long would the pet be alone each day?" htmlFor="adopt-alone">
                                        <input
                                            id="adopt-alone"
                                            type="text"
                                            name="pet_left_alone"
                                            className={fieldClass("pet_left_alone")}
                                            placeholder="e.g. 2 to 4 hours, someone is usually home"
                                            value={formData.pet_left_alone}
                                            onChange={handleChange}
                                        />
                                    </Field>

                                    <Field label="Anything else the owner should know?" htmlFor="adopt-more">
                                        <textarea
                                            id="adopt-more"
                                            name="additional_details"
                                            rows={3}
                                            className={`${fieldClass("additional_details", "py-2.5")} resize-none`}
                                            placeholder="Your experience with pets, your routine, questions for the owner"
                                            value={formData.additional_details}
                                            onChange={handleChange}
                                        />
                                    </Field>

                                    <div>
                                        <CheckRow
                                            checked={formData.agree_to_terms}
                                            onChange={(v) => handleCheckboxChange("agree_to_terms", v)}
                                            label="I agree to give this pet a safe and loving home, cover its vet costs and never abandon it."
                                            description="A safe, loving home environment. Follow-up visits if the owner asks for them."
                                        />
                                        {formErrors.agree_to_terms && (
                                            <p className="mt-1 text-xs text-red-600">{formErrors.agree_to_terms}</p>
                                        )}
                                    </div>
                                </>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </>
            )}
        </Modal>
    );
};

export default AdoptionFormModal;
