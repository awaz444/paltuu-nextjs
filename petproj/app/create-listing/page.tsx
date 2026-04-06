"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store";
import { fetchCities } from "../store/slices/citiesSlice";
import { fetchPetCategories } from "../store/slices/petCategoriesSlice";
import { postPet } from "../store/slices/petSlice";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import "./styles.css";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, message, Collapse } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

const { Panel } = Collapse;

export default function CreatePetListing() {

    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    // Auth hooks
    const { isAuthenticated, user } = useAuth();
    const { status } = useSession();

    // Step state
    const [currentStep, setCurrentStep] = useState(1);
    // Form state
    const [title, setTitle] = useState("");
    const [petType, setPetType] = useState("");
    const [cityId, setCityId] = useState("");
    const [area, setArea] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [description, setDescription] = useState("");
    const [sex, setSex] = useState("male");
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState<number | null>(null);
    const [months, setMonths] = useState<number | null>(null);
    const [healthIssues, setHealthIssues] = useState("");
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [ageError, setAgeError] = useState<string | null>(null);
    const [monthsError, setMonthsError] = useState<string | null>(null);

    // Image upload state
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    // Loading states
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

    const petTags = [
        { tag_id: 1, tag_name: "Playful", tag_category: "personality" },
        { tag_id: 2, tag_name: "Calm", tag_category: "personality" },
        { tag_id: 3, tag_name: "Affectionate", tag_category: "personality" },
        { tag_id: 4, tag_name: "Independent", tag_category: "personality" },
        { tag_id: 5, tag_name: "Vocal", tag_category: "personality" },
        { tag_id: 6, tag_name: "Gentle", tag_category: "personality" },
        { tag_id: 7, tag_name: "Energetic", tag_category: "personality" },
        { tag_id: 8, tag_name: "Shy", tag_category: "personality" },
        { tag_id: 9, tag_name: "Confident", tag_category: "personality" },
        { tag_id: 10, tag_name: "Curious", tag_category: "personality" },
        { tag_id: 11, tag_name: "Good with kids", tag_category: "lifestyle" },
        { tag_id: 12, tag_name: "Apartment friendly", tag_category: "lifestyle" },
        { tag_id: 13, tag_name: "Needs outdoor space", tag_category: "lifestyle" },
        { tag_id: 14, tag_name: "Low maintenance", tag_category: "lifestyle" },
        { tag_id: 15, tag_name: "Lap cat/dog", tag_category: "lifestyle" },
        { tag_id: 16, tag_name: "Active lifestyle", tag_category: "lifestyle" },
        { tag_id: 17, tag_name: "Vaccinated", tag_category: "health" },
        { tag_id: 18, tag_name: "Neutered/Spayed", tag_category: "health" },
        { tag_id: 19, tag_name: "Special needs", tag_category: "health" },
        { tag_id: 20, tag_name: "Senior pet", tag_category: "health" },
        { tag_id: 21, tag_name: "Good with dogs", tag_category: "compatibility" },
        { tag_id: 22, tag_name: "Good with cats", tag_category: "compatibility" },
        { tag_id: 23, tag_name: "Good with other pets", tag_category: "compatibility" },
        { tag_id: 24, tag_name: "Prefers to be only pet", tag_category: "compatibility" },
        { tag_id: 25, tag_name: "Requires Company", tag_category: "compatibility" },
    ];

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    // Authentication check - redirect if not authenticated
    useEffect(() => {
        if (status !== "loading" && !isAuthenticated) {
            router.push("/auth");
        }
    }, [isAuthenticated, status, router]);

    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0)) {
            const numberValue = value ? Number(value) : null;
            setAge(numberValue);

            if (
                (numberValue === null || numberValue === 0) &&
                (months === null || months === 0)
            ) {
                setAgeError("Either age or months must be filled");
                setMonthsError("Either age or months must be filled");
            } else {
                setAgeError(null);
                setMonthsError(null);
            }
        }
    };

    const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        const parsedMonth = value ? parseInt(value) : null;

        if (parsedMonth === null || (parsedMonth >= 0 && parsedMonth <= 11)) {
            setMonths(parsedMonth);

            if (
                (parsedMonth === null || parsedMonth === 0) &&
                (age === null || age === 0)
            ) {
                setAgeError("Either age or months must be filled");
                setMonthsError("Either age or months must be filled");
            } else {
                setAgeError(null);
                setMonthsError(null);
            }
        }
    };


    const beforeUpload = (file: File) => {
        const isImage = file.type.startsWith("image/");
        if (!isImage) {
            message.error("You can only upload image files!");
        }
        const isSmallEnough = file.size / 1024 / 1024 < 5;
        if (!isSmallEnough) {
            message.error("Image must be smaller than 5MB!");
        }
        return isImage && isSmallEnough;
    };

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as File);
        }

        setPreviewImage(file.url || (file.preview as string));
        setPreviewOpen(true);
    };

    const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
        setFileList(newFileList);

    const uploadButton = (
        <button style={{ border: 0, background: "none" }} type="button">
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>Upload</div>
        </button>
    );

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!title) errors.title = "Title is required";
        if (!petType) errors.petType = "Pet type is required";
        if (!cityId) errors.cityId = "City is required";
        if (!contactNumber) errors.contactNumber = "Contact number is required";

        if ((age === null || age === 0) && (months === null || months === 0)) {
            errors.age = "Either age or months must be filled";
            errors.months = "Either age or months must be filled";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!validateForm()) {
            message.error("Please fix the form errors before submitting");
            return;
        }

        if (!user?.id) {
            message.error("Authentication required. Please log in.");
            router.push("/auth");
            return;
        }

        setIsSubmitting(true);

        try {
            const newPet = {
                owner_id: parseInt(user.id),
                pet_name: title || null,
                pet_type: petType ? Number(petType) : null,
                pet_breed: breed || null,
                city_id: cityId ? Number(cityId) : null,
                area: area || "",
                age_months: (age || 0) * 12 + (months || 0),
                contact_number: contactNumber || null,
                description: description || null,
                adoption_status: "available",
                price: null,
                health_issues: healthIssues || null,
                sex: sex || "male",
                listing_type: "adoption",
                tags: selectedTags,
            };

            const petResult = await dispatch(postPet(newPet)).unwrap();
            const petId = petResult?.pet_id;

            if (!petId) {
                throw new Error("Failed to get pet ID from response");
            }

            // Then upload images if any
            if (fileList.length > 0) {
                const formData = new FormData();
                fileList.forEach((file) => {
                    if (file.originFileObj) {
                        formData.append("files", file.originFileObj);
                    }
                });
                formData.append("pet_id", String(petId));

                await axios.post("/api/upload-image", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
            }

            router.push("/listing-created");
        } catch (error) {
            console.error("Error creating pet listing:", error);
            message.error("Failed to create pet listing. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTagToggle = (tagId: number) => {
        setSelectedTags((prev) =>
            prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
        );
    };

    const nextStep = () => {
        // Validate based on current step
        if (currentStep === 1) {
            if (!title || !petType || !cityId || !contactNumber) {
                message.error("Please fill in all required fields");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if ((age === null || age === 0) && (months === null || months === 0)) {
                message.error("Age is required");
                return;
            }
            setCurrentStep(3);
        }
    };

    const prevStep = () => {
        setCurrentStep((prev) => prev - 1);
    };

    // Show loading state while authentication is being determined
    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Show loading state if not authenticated (will redirect)
    if (!isAuthenticated || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="text-lg">Redirecting to login...</div>
            </div>
        );
    }

    return (
        <>
            <div
                className="fullBody min-h-screen py-12 px-4 sm:px-6"
                style={{ maxWidth: "1200px", margin: "0 auto" }}>
                
                {/* Progress Header */}
                <div className="max-w-xl mx-auto mb-12">
                    <div className="flex justify-between items-center relative">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex flex-col items-center relative z-10">
                                <motion.div
                                    initial={false}
                                    animate={{
                                        scale: currentStep === step ? 1.2 : 1,
                                        backgroundColor: currentStep >= step ? "var(--primary-color)" : "#e2e8f0",
                                    }}
                                    className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white transition-all shadow-lg ${
                                        currentStep >= step ? "shadow-primary/20" : ""
                                    }`}>
                                    {step}
                                </motion.div>
                                <span className={`text-[10px] uppercase tracking-widest mt-3 font-black ${currentStep >= step ? "text-primary" : "text-gray-400"}`}>
                                    {step === 1 ? "Essentials" : step === 2 ? "Attributes" : "Gallery"}
                                </span>
                            </div>
                        ))}
                        <div className="absolute top-6 left-0 right-0 h-[2px] bg-gray-100 -z-0">
                            <motion.div
                                className="h-full bg-primary"
                                initial={{ width: "0%" }}
                                animate={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeInOut" }}
                            />
                        </div>
                    </div>
                </div>

                <motion.div 
                    layout
                    className="bg-white p-8 sm:p-12 rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] w-full max-w-2xl mx-auto overflow-hidden relative border border-gray-50">
                    
                    <form onSubmit={handleSubmit}>
                        <AnimatePresence mode="wait">
                            {currentStep === 1 && (
                                <motion.div
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-8">
                                    
                                    <div className="text-center mb-10">
                                        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">The Essentials</h2>
                                        <p className="text-gray-500 font-medium">Start with the fundamental details</p>
                                    </div>


                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Listing Title *</label>
                                            <input
                                                type="text"
                                                required
                                                className="p-5 w-full border rounded-3xl input-field bg-gray-50/50 focus:bg-white text-lg font-bold"
                                                placeholder="e.g. Energetic Husky Mix for Adoption"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Pet Type *</label>
                                                <select
                                                    className="p-5 w-full border rounded-3xl input-field bg-gray-50/50 font-bold appearance-none"
                                                    value={petType}
                                                    required
                                                    onChange={(e) => setPetType(e.target.value)}>
                                                    <option value="">Select Category</option>
                                                    {categories.map((category) => (
                                                        <option key={category.category_id} value={category.category_id}>
                                                            {category.category_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Sex *</label>
                                                <div className="flex gap-2">
                                                    {["male", "female"].map((s) => (
                                                        <button
                                                            key={s}
                                                            type="button"
                                                            onClick={() => setSex(s)}
                                                            className={`flex-1 py-4 rounded-3xl text-sm font-bold capitalize border transition-all ${
                                                                sex === s 
                                                                    ? "border-primary bg-primary/5 text-primary" 
                                                                    : "border-gray-100 bg-gray-50 text-gray-400"
                                                            }`}>
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">City *</label>
                                                <select
                                                    className="p-5 w-full border rounded-3xl input-field bg-gray-50/50 font-bold"
                                                    value={cityId}
                                                    required
                                                    onChange={(e) => setCityId(e.target.value)}>
                                                    <option value="">Choose City</option>
                                                    {cities.map((city) => (
                                                        <option key={city.city_id} value={city.city_id}>
                                                            {city.city_name}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Area/Neighborhood *</label>
                                                <input
                                                    type="text"
                                                    className="p-5 w-full border rounded-3xl input-field bg-gray-50/50"
                                                    placeholder="DHA, Gulberg, etc."
                                                    value={area}
                                                    onChange={(e) => setArea(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="col-span-2">
                                                <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Contact Phone *</label>
                                                <input
                                                    type="text"
                                                    required
                                                    className="p-5 w-full border rounded-3xl input-field bg-gray-50/50"
                                                    placeholder="+92 3..."
                                                    value={contactNumber}
                                                    onChange={(e) => setContactNumber(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <motion.button
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        type="button"
                                        onClick={nextStep}
                                        className="mt-12 p-6 bg-primary text-white rounded-[2rem] w-full font-black text-lg shadow-2xl shadow-primary/30 active:shadow-none transition-shadow">
                                        Next Component
                                    </motion.button>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10">
                                    
                                    <div className="text-center mb-8">
                                        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Traits & Behavior</h2>
                                        <p className="text-gray-500 font-medium">Describe their unique personality</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 p-8 bg-gray-50/50 rounded-[3rem] border border-gray-100">
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Years</label>
                                                <input
                                                    type="number"
                                                    className="p-5 w-full border rounded-3xl input-field bg-white font-bold"
                                                    placeholder="0"
                                                    value={age ?? ""}
                                                    onChange={handleAgeChange}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Months</label>
                                                <input
                                                    type="number"
                                                    max="11"
                                                    className="p-5 w-full border rounded-3xl input-field bg-white font-bold"
                                                    placeholder="0"
                                                    value={months ?? ""}
                                                    onChange={handleMonthsChange}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Breed</label>
                                                <input
                                                    type="text"
                                                    className="p-5 w-full border rounded-3xl input-field bg-white"
                                                    placeholder="e.g. Persian"
                                                    value={breed}
                                                    onChange={(e) => setBreed(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] uppercase tracking-widest font-black text-gray-400 mb-2 ml-1">Health Issues</label>
                                                <input
                                                    type="text"
                                                    className="p-5 w-full border rounded-3xl input-field bg-white"
                                                    placeholder="None / Minor"
                                                    value={healthIssues}
                                                    onChange={(e) => setHealthIssues(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <h3 className="text-sm font-black text-gray-300 uppercase tracking-[0.2em] text-center italic">Select all that apply</h3>
                                        
                                        <div className="space-y-10">
                                            {["personality", "lifestyle", "compatibility", "health"].map((cat) => (
                                                <div key={cat} className="space-y-4">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] uppercase tracking-[0.3em] font-black text-primary/40 leading-none">{cat}</span>
                                                        <div className="h-[1px] flex-1 bg-gray-100"></div>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {petTags
                                                            .filter((t) => t.tag_category === cat)
                                                            .map((tag, idx) => (
                                                                <motion.button
                                                                    whileHover={{ y: -2 }}
                                                                    whileTap={{ scale: 0.95 }}
                                                                    key={tag.tag_id}
                                                                    type="button"
                                                                    onClick={() => handleTagToggle(tag.tag_id)}
                                                                    className={`px-6 py-3 rounded-2xl text-xs font-bold transition-all border-2 ${
                                                                        selectedTags.includes(tag.tag_id)
                                                                            ? "bg-primary border-primary text-white shadow-xl shadow-primary/20"
                                                                            : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                                                                    }`}>
                                                                    {tag.tag_name}
                                                                </motion.button>
                                                            ))}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="p-6 bg-gray-50 text-gray-400 rounded-[2rem] w-1/3 font-black hover:bg-gray-100 transition-all">
                                            Return
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="button"
                                            onClick={nextStep}
                                            className="p-6 bg-primary text-white rounded-[2rem] flex-1 font-black shadow-xl shadow-primary/10">
                                            Almost Done
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="space-y-10">
                                    
                                    <div className="text-center">
                                        <h2 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Final Details</h2>
                                        <p className="text-gray-500 font-medium">Add photos and a short description</p>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[11px] uppercase tracking-widest font-black text-gray-400 mb-3 ml-1">The Story</label>
                                            <textarea
                                                className="p-6 w-full border rounded-[2.5rem] input-field bg-gray-50/50 min-h-[180px] text-gray-700 leading-relaxed font-medium"
                                                placeholder="Tell us about their habits, favorite toys, or how you found them..."
                                                value={description}
                                                onChange={(e) => setDescription(e.target.value)}></textarea>
                                        </div>

                                        <div className="p-10 bg-gray-50/30 rounded-[3rem] border-2 border-dashed border-gray-100 flex flex-col items-center">
                                            <label className="text-[11px] uppercase tracking-widest font-black text-gray-400 mb-8">Photos Gallery (Max 5)</label>
                                            <Upload
                                                className="listing-uploader scale-110"
                                                listType="picture-card"
                                                fileList={fileList}
                                                onPreview={handlePreview}
                                                onChange={handleChange}
                                                beforeUpload={beforeUpload}
                                                maxCount={5}>
                                                {fileList.length >= 5 ? null : (
                                                    <div className="flex flex-col items-center opacity-40 hover:opacity-100 transition-opacity">
                                                        <PlusOutlined style={{ fontSize: "32px", color: "var(--primary-color)" }} />
                                                        <div className="mt-2 text-[10px] font-black uppercase tracking-tighter">Add</div>
                                                    </div>
                                                )}
                                            </Upload>
                                        </div>
                                    </div>

                                    {previewImage && (
                                        <Image
                                            wrapperStyle={{ display: "none" }}
                                            preview={{
                                                visible: previewOpen,
                                                onVisibleChange: (visible) => setPreviewOpen(visible),
                                                afterOpenChange: (visible) => !visible && setPreviewImage(""),
                                            }}
                                            src={previewImage}
                                        />
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={prevStep}
                                            className="p-6 bg-gray-50 text-gray-400 rounded-[2rem] w-1/3 font-black hover:bg-gray-100 transition-all">
                                            Back
                                        </button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            type="submit"
                                            className="p-6 bg-[#1a1a1a] text-white rounded-[2rem] flex-1 font-black shadow-2xl shadow-black/20 disabled:bg-gray-200 transition-all"
                                            disabled={isSubmitting}>
                                            {isSubmitting ? "Generating..." : "Launch Listing"}
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>
                </motion.div>
            </div>
        </>
    );
}