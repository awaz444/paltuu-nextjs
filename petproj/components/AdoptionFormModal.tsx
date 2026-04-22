"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import { 
    XMarkIcon, 
    ChevronRightIcon, 
    ChevronLeftIcon,
    CheckCircleIcon,
    HeartIcon,
    InformationCircleIcon,
    HomeIcon,
    UserIcon,
    PhoneIcon,
    MapPinIcon
} from "@heroicons/react/24/outline";

interface City {
    city_id: number;
    city_name: string;
}

interface AdoptionFormProps {
    petId: number;
    userId: string;
    visible: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

const AdoptionFormModal: React.FC<AdoptionFormProps> = ({
    petId,
    userId,
    visible,
    onClose,
    onSubmit,
}) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cities, setCities] = useState<City[]>([]);
    
    // Form state
    const [formData, setFormData] = useState({
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
    });

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }));
    };

    const validateStep = (step: number) => {
        const errors: Record<string, string> = {};
        if (step === 1) {
            if (!formData.adopter_name) errors.adopter_name = "Name is required";
            if (!formData.city_id) errors.city_id = "City is required";
            if (!formData.contact_number) errors.contact_number = "Phone number is required";
            if (!formData.adopter_address) errors.adopter_address = "Address is required";
        } else if (step === 3) {
            if (!formData.agree_to_terms) errors.agree_to_terms = "You must agree to the terms";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handleBack = () => {
        setCurrentStep(prev => prev - 1);
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
                contact_number: `+92${formData.contact_number}`
            };

            const response = await fetch('/api/v1/applications/adoption', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Adoption form submitted successfully!');
                onSubmit(result);
                setCurrentStep(1);
                setFormData({
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
                });
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Failed to submit form');
            }
        } catch (err) {
            console.error("Submission error:", err);
            toast.error('An error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh] border border-gray-50"
            >
                {/* Header */}
                <div className="p-8 pb-4 flex justify-between items-center bg-white z-10">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="h-2 w-8 bg-primary rounded-full" />
                            <span className="text-[10px] uppercase tracking-widest font-black text-primary">Adoption Application</span>
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 leading-none">Complete Your Profile</h2>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl transition-colors text-gray-400 hover:text-gray-900"
                    >
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-10 mb-4">
                    <div className="flex justify-between items-center relative">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex flex-col items-center relative z-10">
                                <motion.div
                                    animate={{
                                        scale: currentStep === step ? 1.1 : 1,
                                        backgroundColor: currentStep >= step ? "var(--primary-color, #a03048)" : "#f1f5f9",
                                        color: currentStep >= step ? "#ffffff" : "#94a3b8"
                                    }}
                                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold shadow-sm transition-all`}
                                >
                                    {currentStep > step ? <CheckCircleIcon className="w-6 h-6" /> : step}
                                </motion.div>
                            </div>
                        ))}
                        <div className="absolute top-5 left-8 right-8 h-[2px] bg-slate-100 -z-0">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-10 pt-4 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        {currentStep === 1 && (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-black text-gray-800">Essential Information</h3>
                                    <p className="text-gray-500 font-medium">Let us know who you are</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="group">
                                        <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Full Name *</label>
                                        <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-primary transition-all">
                                            <UserIcon className="w-5 h-5 text-gray-400 mr-3" />
                                            <input
                                                type="text"
                                                name="adopter_name"
                                                className="bg-transparent border-none outline-none w-full font-bold text-gray-900"
                                                placeholder="Enter your full name"
                                                value={formData.adopter_name}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {formErrors.adopter_name && <span className="text-red-500 text-xs ml-1 mt-1 font-bold">{formErrors.adopter_name}</span>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">City *</label>
                                            <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-primary transition-all">
                                                <MapPinIcon className="w-5 h-5 text-gray-400 mr-3" />
                                                <select
                                                    name="city_id"
                                                    className="bg-transparent border-none outline-none w-full font-bold text-gray-900 appearance-none"
                                                    value={formData.city_id}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Select City</option>
                                                    {cities.map(city => (
                                                        <option key={city.city_id} value={city.city_id}>{city.city_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            {formErrors.city_id && <span className="text-red-500 text-xs ml-1 mt-1 font-bold">{formErrors.city_id}</span>}
                                        </div>
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Phone Number *</label>
                                            <div className="flex items-center p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-primary transition-all">
                                                <span className="text-gray-400 font-bold mr-2">+92</span>
                                                <input
                                                    type="tel"
                                                    name="contact_number"
                                                    className="bg-transparent border-none outline-none w-full font-bold text-gray-900"
                                                    placeholder="3331234567"
                                                    value={formData.contact_number}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                                        setFormData(prev => ({ ...prev, contact_number: val }));
                                                    }}
                                                />
                                            </div>
                                            {formErrors.contact_number && <span className="text-red-500 text-xs ml-1 mt-1 font-bold">{formErrors.contact_number}</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Area / Address *</label>
                                        <div className="flex items-start p-4 bg-gray-50/50 rounded-2xl border border-gray-100 focus-within:bg-white focus-within:border-primary transition-all">
                                            <HomeIcon className="w-5 h-5 text-gray-400 mr-3 mt-1" />
                                            <textarea
                                                name="adopter_address"
                                                rows={2}
                                                className="bg-transparent border-none outline-none w-full font-bold text-gray-900 resize-none"
                                                placeholder="Enter your general area or neighborhood"
                                                value={formData.adopter_address}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        {formErrors.adopter_address && <span className="text-red-500 text-xs ml-1 mt-1 font-bold">{formErrors.adopter_address}</span>}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-black text-gray-800">Household Details</h3>
                                    <p className="text-gray-500 font-medium">Help us understand the environment</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Youngest Child Age</label>
                                            <input
                                                type="number"
                                                name="age_of_youngest_child"
                                                className="p-4 w-full bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-900"
                                                placeholder="Enter age (if any)"
                                                value={formData.age_of_youngest_child}
                                                onChange={handleChange}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Where will pet sleep?</label>
                                            <input
                                                type="text"
                                                name="pet_sleep_location"
                                                className="p-4 w-full bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-900"
                                                placeholder="e.g. Indoors, Living room"
                                                value={formData.pet_sleep_location}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Other Pets Details</label>
                                        <textarea
                                            name="other_pets_details"
                                            rows={2}
                                            className="p-4 w-full bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-900 resize-none"
                                            placeholder="Provide details about other pets at home"
                                            value={formData.other_pets_details}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleCheckboxChange("other_pets_neutered", !formData.other_pets_neutered)}
                                            className={`px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all border-2 flex items-center gap-2 ${formData.other_pets_neutered ? "bg-primary border-primary text-white" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                        >
                                            <CheckCircleIcon className={`w-5 h-5 ${formData.other_pets_neutered ? "text-white" : "text-gray-100"}`} />
                                            Other Pets Neutered?
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleCheckboxChange("has_secure_outdoor_area", !formData.has_secure_outdoor_area)}
                                            className={`px-6 py-4 rounded-[1.5rem] text-sm font-black transition-all border-2 flex items-center gap-2 ${formData.has_secure_outdoor_area ? "bg-primary border-primary text-white" : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"}`}
                                        >
                                            <CheckCircleIcon className={`w-5 h-5 ${formData.has_secure_outdoor_area ? "text-white" : "text-gray-100"}`} />
                                            Secure Outdoor Area?
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div
                                key="step3"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-black text-gray-800">Final Details</h3>
                                    <p className="text-gray-500 font-medium">Just a few more things</p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Time Left Alone</label>
                                        <input
                                            type="text"
                                            name="pet_left_alone"
                                            className="p-4 w-full bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-900"
                                            placeholder="e.g. 2-4 hours, with sitter"
                                            value={formData.pet_left_alone}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Additional Details</label>
                                        <textarea
                                            name="additional_details"
                                            rows={2}
                                            className="p-4 w-full bg-gray-50/50 rounded-2xl border border-gray-100 font-bold text-gray-900 resize-none"
                                            placeholder="Anything else we should know?"
                                            value={formData.additional_details}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100">
                                        <div className="flex items-start gap-3">
                                            <div 
                                                onClick={() => handleCheckboxChange("agree_to_terms", !formData.agree_to_terms)}
                                                className={`mt-1 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${formData.agree_to_terms ? "bg-primary border-primary" : "bg-white border-gray-200"}`}
                                            >
                                                {formData.agree_to_terms && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-800 mb-4 leading-tight">I agree to provide a safe and loving environment, cover veterinary costs, and never abandon the pet.</p>
                                                <div className="space-y-2">
                                                    <div className="flex items-start gap-2">
                                                        <HeartIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-gray-500 font-medium">Safe & loving home environment</span>
                                                    </div>
                                                    <div className="flex items-start gap-2">
                                                        <InformationCircleIcon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                                        <span className="text-xs text-gray-500 font-medium">Allow follow-up visits if required</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        {formErrors.agree_to_terms && <p className="text-red-500 text-xs font-bold mt-3 text-center">{formErrors.agree_to_terms}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Footer Controls */}
                <div className="p-10 pt-4 flex gap-4 bg-white z-10">
                    {currentStep > 1 && (
                        <button
                            onClick={handleBack}
                            className="p-6 bg-gray-50 text-gray-400 rounded-[2rem] w-1/3 font-black flex items-center justify-center transition-all hover:bg-gray-100"
                        >
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                    )}
                    
                    {currentStep < 3 ? (
                        <button
                            onClick={handleNext}
                            className="p-6 bg-primary text-white rounded-[2rem] flex-1 font-black flex items-center justify-center gap-2 shadow-2xl shadow-primary/30 active:shadow-none transition-all hover:scale-[1.02]"
                        >
                            Next Step
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={handleFormSubmit}
                            disabled={loading}
                            className="p-6 bg-[#1a1a1a] text-white rounded-[2rem] flex-1 font-black flex items-center justify-center gap-2 shadow-2xl shadow-black/20 disabled:bg-gray-200 transition-all hover:scale-[1.02]"
                        >
                            {loading ? "Submitting..." : "Submit Application"}
                            <CheckCircleIcon className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default AdoptionFormModal;