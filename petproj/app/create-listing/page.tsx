"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store";
import { fetchCities } from "../store/slices/citiesSlice";
import { fetchPetCategories } from "../store/slices/petCategoriesSlice";
import { postPet } from "../store/slices/petSlice";
import { useRouter } from "next/navigation";
import "./styles.css";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, message } from "antd";
import type { UploadFile, UploadProps } from "antd";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import PhoneNumberInput from "../../components/PhoneNumberInput";
import { isValidPhone } from "@/utils/phone";
import { compressImageFiles } from "@/utils/imageCompression";
import { formatAge } from "@/utils/formatAge";
import { ArrowLeft, ArrowRight, ImageIcon, ImagePlus, MapPin } from "lucide-react";
import { Field, inputClass, inputErrorClass, Segmented, Chip, StepBar, btn, cardClass, Spinner } from "@/components/account/ui";
import { authUrl } from "@/lib/authRedirect";


// Only allow letters (Latin + Urdu range), digits, spaces and basic punctuation
const TITLE_RE = /^[a-zA-Z0-9؀-ۿ\s\-,.'&()]+$/;

type Breed = { breed_id: number; category_id: number; name: string };

const STEP_LABELS = ["Basics", "About the pet", "Photos and story"];
const TAG_GROUPS = [
    { key: "personality", label: "Personality" },
    { key: "lifestyle", label: "Lifestyle" },
    { key: "compatibility", label: "Compatibility" },
    { key: "health", label: "Health" },
];

export default function CreatePetListing() {

    const router = useRouter();
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    const { isAuthenticated, user } = useAuth();
    const { status } = useSession();

    const [currentStep, setCurrentStep] = useState(1);
    // Each step starts at the top; on phones Next sits below the fold.
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [currentStep]);
    const [title, setTitle] = useState("");
    const [petType, setPetType] = useState("");
    const [cityId, setCityId] = useState("");
    const [area, setArea] = useState("");
    const [contactNumber, setContactNumber] = useState("");
    const [description, setDescription] = useState("");
    const [sex, setSex] = useState("male");
    const [breedId, setBreedId] = useState("");
    const [breeds, setBreeds] = useState<Breed[]>([]);
    const [age, setAge] = useState<number | null>(null);
    const [months, setMonths] = useState<number | null>(null);
    const [healthIssues, setHealthIssues] = useState("");
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [ageError, setAgeError] = useState<string | null>(null);
    const [monthsError, setMonthsError] = useState<string | null>(null);

    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
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
        axios.get<Breed[]>("/api/v1/breeds").then((r) => setBreeds(r.data)).catch(() => setBreeds([]));
    }, [dispatch]);

    // Only species with a breed list can be listed (PALTU-70 breeds table).
    const listableCategories = categories.filter((c) => breeds.some((b) => b.category_id === c.category_id));
    const breedOptions = breeds.filter((b) => String(b.category_id) === petType);

    useEffect(() => {
        if (status !== "loading" && !isAuthenticated) {
            router.push(authUrl("/create-listing"));
        }
    }, [isAuthenticated, status, router]);

    // ── Input handlers with validation ──────────────────────────────────────

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (v === "" || (TITLE_RE.test(v) && v.length <= 80)) setTitle(v);
    };

    const handleAreaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (v === "" || (TITLE_RE.test(v) && v.length <= 100)) setArea(v);
    };

    const handleHealthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        if (v.length <= 200) setHealthIssues(v);
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const v = e.target.value;
        if (v.length <= 2500) setDescription(v);
    };


    const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === "" || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= 30)) {
            const n = value ? Number(value) : null;
            setAge(n);
            if ((n === null || n === 0) && (months === null || months === 0)) {
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
        const n = value ? parseInt(value) : null;
        if (n === null || (n >= 0 && n <= 11)) {
            setMonths(n);
            if ((n === null || n === 0) && (age === null || age === 0)) {
                setAgeError("Either age or months must be filled");
                setMonthsError("Either age or months must be filled");
            } else {
                setAgeError(null);
                setMonthsError(null);
            }
        }
    };

    // ── Image upload ─────────────────────────────────────────────────────────

    const MAX_UPLOAD_MB = 25;
    const beforeUpload = (file: File) => {
        // Don't hard-reject on file.type: iPhone HEIC/HEIF photos frequently
        // arrive with an empty or non-image MIME type in Chrome/Firefox/Windows.
        // The server re-decodes and compresses every file, so let anything that
        // looks image-ish through and let the API be the real gate. SVG is the
        // one format we do block up front (script-injection risk).
        const name = file.name.toLowerCase();
        const isSvg = file.type === "image/svg+xml" || name.endsWith(".svg");
        if (isSvg) {
            message.error("SVG images aren't supported. Please use a JPG, PNG, HEIC or WebP.");
            return Upload.LIST_IGNORE;
        }
        const looksImage =
            file.type.startsWith("image/") ||
            file.type === "" ||
            /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif|jfif)$/.test(name);
        if (!looksImage) {
            message.error("That doesn't look like an image file.");
            return Upload.LIST_IGNORE;
        }
        const isSmallEnough = file.size / 1024 / 1024 < MAX_UPLOAD_MB;
        if (!isSmallEnough) {
            message.error(`Image must be smaller than ${MAX_UPLOAD_MB}MB.`);
            return Upload.LIST_IGNORE;
        }
        return true;
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

    // ── Validation ───────────────────────────────────────────────────────────

    const validateStep1 = (): boolean => {
        const errors: Record<string, string> = {};
        if (!title.trim()) {
            errors.title = "Title is required";
        } else if (title.trim().length < 2) {
            errors.title = "Title must be at least 2 characters";
        }
        if (!petType) errors.petType = "Pet type is required";
        if (!cityId) errors.cityId = "City is required";
        if (!contactNumber) {
            errors.contactNumber = "Contact number is required";
        } else if (!isValidPhone(contactNumber)) {
            errors.contactNumber = "Enter a valid mobile number (e.g. 03XX XXXXXXX or +92 3XX XXXXXXX)";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};
        if (!title.trim()) {
            errors.title = "Title is required";
        } else if (title.trim().length < 2) {
            errors.title = "Title must be at least 2 characters";
        }
        if (!petType) errors.petType = "Pet type is required";
        if (!cityId) errors.cityId = "City is required";
        if (!contactNumber) {
            errors.contactNumber = "Contact number is required";
        } else if (!isValidPhone(contactNumber)) {
            errors.contactNumber = "Enter a valid mobile number (e.g. 03XX XXXXXXX or +92 3XX XXXXXXX)";
        }
        if (!breedId) errors.breed = "Pick a breed, or Not sure";
        if ((age === null || age === 0) && (months === null || months === 0)) {
            errors.age = "Either age or months must be filled";
            errors.months = "Either age or months must be filled";
        }
        if (description && description.length > 2500) {
            errors.description = "Description must be 2,500 characters or fewer";
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
        if (fileList.length === 0) {
            message.error("Please add at least one picture of the pet.");
            return;
        }
        if (!user?.id) {
            message.error("Authentication required. Please log in.");
            router.push(authUrl("/create-listing"));
            return;
        }
        setIsSubmitting(true);
        let petId: number | null = null;
        try {
            const newPet = {
                pet_name: title || null,
                pet_type: petType ? Number(petType) : null,
                breed_id: breedId ? Number(breedId) : null,
                pet_breed: breedOptions.find((b) => String(b.breed_id) === breedId)?.name ?? null,
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
            petId = petResult?.pet_id;
            if (!petId) throw new Error("Failed to get pet ID from response");
            if (fileList.length > 0) {
                const rawFiles = fileList
                    .map((file) => file.originFileObj as File)
                    .filter(Boolean);
                const compressedFiles = await compressImageFiles(rawFiles);
                const formData = new FormData();
                compressedFiles.forEach((file) => {
                    formData.append("files", file);
                });
                formData.append("pet_id", String(petId));
                formData.append("notify_new_listing", "true");
                await axios.post("/api/v1/upload-image", formData, {
                    headers: { "Content-Type": "multipart/form-data" },
                });
            }
            router.push("/listing-created");
        } catch (error: any) {
            console.error("Error creating pet listing:", error);
            if (petId) {
                try {
                    await axios.delete(`/api/v1/pets/${petId}`);
                } catch (deleteError) {
                    console.error("Failed to roll back pet listing creation:", deleteError);
                }
            }
            const is413 = error?.response?.status === 413 || error?.message?.includes("413");
            const errMsg = is413
                ? "The uploaded photos are too large. Please try with smaller photos."
                : (error?.response?.data?.error || error?.message || (typeof error === 'string' ? error : "Failed to create pet listing. Please try again."));
            message.error(errMsg);
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
        if (currentStep === 1) {
            if (!validateStep1()) {
                message.error("Please fix the errors before continuing");
                return;
            }
            setCurrentStep(2);
        } else if (currentStep === 2) {
            if (!breedId) {
                setFormErrors((prev) => ({ ...prev, breed: "Pick a breed, or Not sure" }));
                message.error("Breed is required");
                return;
            }
            if ((age === null || age === 0) && (months === null || months === 0)) {
                message.error("Age is required");
                return;
            }
            setCurrentStep(3);
        }
    };

    const prevStep = () => setCurrentStep((prev) => prev - 1);

    // Cover photo for the live preview card.
    const coverFile = fileList[0]?.originFileObj as File | undefined;
    const [coverUrl, setCoverUrl] = useState<string | null>(null);
    useEffect(() => {
        if (!coverFile) {
            setCoverUrl(null);
            return;
        }
        const url = URL.createObjectURL(coverFile);
        setCoverUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [coverFile]);

    if (status === "loading" || !isAuthenticated || !user) {
        return (
            <main className="min-h-screen bg-gray-50">
                <Spinner label={status === "loading" ? "Loading" : "Redirecting to sign in"} />
            </main>
        );
    }

    const fieldClass = (hasError: boolean, extra = "h-11") => `${inputClass} ${extra} ${hasError ? inputErrorClass : ""}`;
    const selectedBreedName = breedOptions.find((b) => String(b.breed_id) === breedId)?.name;
    const selectedCityName = cities.find((c) => String(c.city_id) === cityId)?.city_name;
    const hasAge = !((age === null || age === 0) && (months === null || months === 0));

    const stepHeading = (heading: string, subline: string) => (
        <div className="mb-5">
            <h2 className="text-base font-semibold text-gray-900">{heading}</h2>
            <p className="mt-0.5 text-sm text-gray-600">{subline}</p>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50">
            <div className="mx-auto max-w-3xl px-4 py-6 md:py-10 lg:max-w-5xl">
                <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-8">
                    <div className="min-w-0">
                        <header className="mb-6">
                            <h1 className="text-2xl font-semibold leading-tight text-gray-900 md:text-[28px]">List a pet for adoption</h1>
                            <p className="mt-1.5 text-sm text-gray-600">
                                Free to list. The Paltuu team checks every listing before it goes live.
                            </p>
                        </header>

                        <div className="mb-4">
                            <StepBar step={currentStep} total={STEP_LABELS.length} label={STEP_LABELS[currentStep - 1]} />
                        </div>

                        <form onSubmit={handleSubmit} noValidate>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={currentStep}
                                    initial={{ opacity: 0, x: 8 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    transition={{ duration: 0.15 }}>
                                    {currentStep === 1 && (
                                        <section className={`${cardClass} p-5 md:p-6`}>
                                            {stepHeading("Basics", "What you're listing, where the pet is and how adopters reach you.")}
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="sm:col-span-2">
                                                    <Field
                                                        label="Listing title"
                                                        required
                                                        htmlFor="cl-title"
                                                        error={formErrors.title}
                                                        hint={`${title.length}/80. Usually the pet's name, or a short description.`}>
                                                        <input
                                                            id="cl-title"
                                                            type="text"
                                                            className={fieldClass(!!formErrors.title)}
                                                            placeholder="e.g. Bruno, a playful Labrador mix"
                                                            value={title}
                                                            onChange={handleTitleChange}
                                                        />
                                                    </Field>
                                                </div>

                                                <Field label="Pet type" required htmlFor="cl-type" error={formErrors.petType}>
                                                    <select
                                                        id="cl-type"
                                                        className={fieldClass(!!formErrors.petType)}
                                                        value={petType}
                                                        onChange={(e) => {
                                                            setPetType(e.target.value);
                                                            setBreedId("");
                                                        }}>
                                                        <option value="">Select type</option>
                                                        {listableCategories.map((category) => (
                                                            <option key={category.category_id} value={category.category_id}>
                                                                {category.category_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>

                                                <Field label="Sex" required>
                                                    <Segmented
                                                        label="Sex"
                                                        value={sex}
                                                        onChange={setSex}
                                                        options={[
                                                            { value: "male", label: "Male" },
                                                            { value: "female", label: "Female" },
                                                        ]}
                                                    />
                                                </Field>

                                                <Field label="City" required htmlFor="cl-city" error={formErrors.cityId}>
                                                    <select
                                                        id="cl-city"
                                                        className={fieldClass(!!formErrors.cityId)}
                                                        value={cityId}
                                                        onChange={(e) => setCityId(e.target.value)}>
                                                        <option value="">Select city</option>
                                                        {cities.map((city) => (
                                                            <option key={city.city_id} value={city.city_id}>
                                                                {city.city_name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>

                                                <Field label="Area or neighbourhood" htmlFor="cl-area">
                                                    <input
                                                        id="cl-area"
                                                        type="text"
                                                        className={fieldClass(false)}
                                                        placeholder="e.g. DHA, Gulberg"
                                                        value={area}
                                                        onChange={handleAreaChange}
                                                    />
                                                </Field>

                                                <div className="sm:col-span-2">
                                                    <Field
                                                        label="Contact phone"
                                                        required
                                                        htmlFor="cl-phone"
                                                        error={formErrors.contactNumber}
                                                        hint="Pick your country, then enter the number without the leading zero.">
                                                        <PhoneNumberInput
                                                            id="cl-phone"
                                                            value={contactNumber}
                                                            onChange={setContactNumber}
                                                            hasError={!!formErrors.contactNumber}
                                                            className={`${inputClass} flex h-11 items-center focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-tint ${
                                                                formErrors.contactNumber ? inputErrorClass : ""
                                                            }`}
                                                            inputClassName="!font-normal"
                                                        />
                                                    </Field>
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {currentStep === 2 && (
                                        <section className={`${cardClass} p-5 md:p-6`}>
                                            {stepHeading("About the pet", "Age, breed and a few words about their character.")}
                                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <Field label="Age in years" required htmlFor="cl-years" error={ageError}>
                                                        <input
                                                            id="cl-years"
                                                            type="number"
                                                            inputMode="numeric"
                                                            min="0"
                                                            max="30"
                                                            className={fieldClass(!!ageError)}
                                                            placeholder="0"
                                                            value={age ?? ""}
                                                            onChange={handleAgeChange}
                                                        />
                                                    </Field>
                                                    <Field label="And months" htmlFor="cl-months" hint="0 to 11">
                                                        <input
                                                            id="cl-months"
                                                            type="number"
                                                            inputMode="numeric"
                                                            min="0"
                                                            max="11"
                                                            className={fieldClass(!!monthsError)}
                                                            placeholder="0"
                                                            value={months ?? ""}
                                                            onChange={handleMonthsChange}
                                                        />
                                                    </Field>
                                                </div>

                                                <Field
                                                    label="Breed"
                                                    required
                                                    htmlFor="cl-breed"
                                                    error={formErrors.breed}
                                                    hint={petType ? undefined : "Choose the pet type first."}>
                                                    <select
                                                        id="cl-breed"
                                                        className={fieldClass(!!formErrors.breed)}
                                                        value={breedId}
                                                        onChange={(e) => setBreedId(e.target.value)}>
                                                        <option value="">Select breed</option>
                                                        {breedOptions.map((b) => (
                                                            <option key={b.breed_id} value={b.breed_id}>
                                                                {b.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </Field>

                                                <div className="sm:col-span-2">
                                                    <Field label="Health issues" htmlFor="cl-health" hint="Leave empty if there are none.">
                                                        <input
                                                            id="cl-health"
                                                            type="text"
                                                            className={fieldClass(false)}
                                                            placeholder="e.g. Recovering from a leg injury"
                                                            value={healthIssues}
                                                            onChange={handleHealthChange}
                                                            maxLength={200}
                                                        />
                                                    </Field>
                                                </div>
                                            </div>

                                            <div className="mt-6 border-t border-gray-100 pt-5">
                                                <h3 className="text-sm font-semibold text-gray-900">What are they like?</h3>
                                                <p className="mt-0.5 text-sm text-gray-600">Pick any that fit. They show as tags on the listing.</p>
                                                <div className="mt-4 space-y-4">
                                                    {TAG_GROUPS.map((group) => (
                                                        <div key={group.key}>
                                                            <p className="mb-2 text-xs font-medium text-gray-600">{group.label}</p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {petTags
                                                                    .filter((t) => t.tag_category === group.key)
                                                                    .map((tag) => (
                                                                        <Chip
                                                                            key={tag.tag_id}
                                                                            selected={selectedTags.includes(tag.tag_id)}
                                                                            onClick={() => handleTagToggle(tag.tag_id)}>
                                                                            {tag.tag_name}
                                                                        </Chip>
                                                                    ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    )}

                                    {currentStep === 3 && (
                                        <section className={`${cardClass} p-5 md:p-6`}>
                                            {stepHeading("Photos and story", "Clear photos and an honest story get pets adopted faster.")}
                                            <div className="space-y-5">
                                                <Field label="Photos" required hint="Up to 5 photos. The first one is the cover.">
                                                    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4">
                                                        <Upload
                                                            className="listing-uploader"
                                                            listType="picture-card"
                                                            fileList={fileList}
                                                            onPreview={handlePreview}
                                                            onChange={handleChange}
                                                            beforeUpload={beforeUpload}
                                                            maxCount={5}>
                                                            {fileList.length >= 5 ? null : (
                                                                <div className="flex flex-col items-center gap-1 text-gray-500">
                                                                    <ImagePlus size={20} className="text-primary" />
                                                                    <span className="text-xs font-medium">Add photo</span>
                                                                </div>
                                                            )}
                                                        </Upload>
                                                    </div>
                                                </Field>

                                                <Field
                                                    label="Description"
                                                    htmlFor="cl-description"
                                                    error={formErrors.description}
                                                    hint={`${description.length}/2500`}>
                                                    <textarea
                                                        id="cl-description"
                                                        rows={6}
                                                        className={`${fieldClass(!!formErrors.description, "py-2.5")} min-h-[160px] leading-relaxed`}
                                                        placeholder="Their habits, favourite toys, how you found them, and why you're rehoming them."
                                                        value={description}
                                                        onChange={handleDescriptionChange}
                                                        maxLength={2500}
                                                    />
                                                </Field>
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
                                        </section>
                                    )}
                                </motion.div>
                            </AnimatePresence>

                            <div className="mt-4 flex gap-2 sm:justify-end">
                                {currentStep > 1 && (
                                    <button type="button" onClick={prevStep} disabled={isSubmitting} className={`${btn.secondary} flex-1 sm:flex-none`}>
                                        <ArrowLeft size={16} />
                                        Back
                                    </button>
                                )}
                                {currentStep < 3 ? (
                                    <button type="button" onClick={nextStep} className={`${btn.primary} flex-1 sm:flex-none`}>
                                        Next
                                        <ArrowRight size={16} />
                                    </button>
                                ) : (
                                    <button type="submit" disabled={isSubmitting} className={`${btn.primary} flex-1 sm:flex-none`}>
                                        {isSubmitting ? "Publishing…" : "Publish listing"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Live preview, the same card adopters see on Browse Pets. */}
                    <aside className="hidden lg:block" aria-label="Listing preview">
                        <div className="sticky top-24">
                            <p className="mb-2 text-xs font-medium text-gray-600">Preview on Browse Pets</p>
                            <div className="overflow-hidden rounded-3xl bg-white px-4 pt-4 shadow-sm">
                                <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                                    {coverUrl ? (
                                        <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <ImageIcon size={32} className="text-gray-300" aria-hidden="true" />
                                    )}
                                </div>
                                <div className="py-4">
                                    <h3 className="mb-1 truncate font-bold text-gray-900">{title.trim() || "Pet's name"}</h3>
                                    <p className="mb-1 truncate text-gray-600">
                                        {[selectedBreedName, hasAge ? formatAge((age || 0) * 12 + (months || 0)) : null]
                                            .filter(Boolean)
                                            .join(" · ") || "Breed and age"}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <MapPin size={14} className="shrink-0 text-primary" />
                                        <p className="truncate text-gray-600">{selectedCityName || "City"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
