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
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [paymentFrequency, setPaymentFrequency] = useState("");
    const [sex, setSex] = useState("male");
    // Fields moved to accordion
    const [breed, setBreed] = useState("");
    const [age, setAge] = useState<number | null>(null);
    const [months, setMonths] = useState<number | null>(null);
    const [vaccinated, setVaccinated] = useState(false);
    const [neutered, setNeutered] = useState(false);
    const [minAgeOfChildren, setMinAgeOfChildren] = useState(0);
    const [canLiveWithDogs, setCanLiveWithDogs] = useState(false);
    const [canLiveWithCats, setCanLiveWithCats] = useState(false);
    const [mustHaveSomeoneHome, setMustHaveSomeoneHome] = useState(false);
    const [energyLevel, setEnergyLevel] = useState<number | null>(null);
    const [cuddlinessLevel, setCuddlinessLevel] = useState<number | null>(null);
    const [healthIssues, setHealthIssues] = useState("");
    const [ageError, setAgeError] = useState<string | null>(null);
    const [monthsError, setMonthsError] = useState<string | null>(null);
    // Track if sliders have been touched
    const [energyLevelTouched, setEnergyLevelTouched] = useState(false);
    const [cuddlinessLevelTouched, setCuddlinessLevelTouched] = useState(false);

    // Image upload state
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    // Loading states
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

    const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPrice(e.target.value);
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
            // Determine listing type based on price
            const listingType = price ? "sell" : "adoption";

            // First create the pet
            const newPet = {
                owner_id: parseInt(user.id),
                pet_name: title || null,
                pet_type: petType ? Number(petType) : null,
                pet_breed: breed || null,
                city_id: cityId ? Number(cityId) : null,
                area: area || "",
                age_months: (age || 0) * 12 + (months || 0),
                description: description || null,
                adoption_status: "available",
                price: price ? Number(price) : null,
                min_age_of_children: minAgeOfChildren || null,
                can_live_with_dogs: canLiveWithDogs,
                can_live_with_cats: canLiveWithCats,
                must_have_someone_home: mustHaveSomeoneHome,
                energy_level: energyLevelTouched ? energyLevel : null, // Only send if touched
                cuddliness_level: cuddlinessLevelTouched ? cuddlinessLevel : null, // Only send if touched
                health_issues: healthIssues || null,
                sex: sex || "male",
                listing_type: listingType,
                vaccinated,
                neutered,
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

    const nextStep = () => {
        // Validate required fields before proceeding
        if (!title || !petType || !cityId) {
            message.error("Please fill in all required fields");
            return;
        }
        setCurrentStep(2);
    };

    const prevStep = () => {
        setCurrentStep(1);
    };

    // Handle energy level change
    const handleEnergyLevelChange = (value: number) => {
        if (!energyLevelTouched) {
            setEnergyLevelTouched(true);
        }
        setEnergyLevel(value);
    };

    // Handle cuddliness level change
    const handleCuddlinessLevelChange = (value: number) => {
        if (!cuddlinessLevelTouched) {
            setCuddlinessLevelTouched(true);
        }
        setCuddlinessLevel(value);
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
                className="fullBody min-h-screen"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <form
                    className="bg-white p-6 rounded-3xl shadow-md w-full max-w-lg mx-auto my-8"
                    onSubmit={handleSubmit}>
                    <h2 className="text-2xl font-bold mb-6 text-center">
                        {currentStep === 1
                            ? "Create Pet Listing"
                            : "Upload Images"}
                    </h2>

                    {currentStep === 1 ? (
                        <>
                            {/* Title (replaces Pet Name) */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    placeholder="E.g. 'Max the friendly dog' or '5 kittens needing homes'"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Give your listing a descriptive title that
                                    will attract potential adopters
                                </p>
                            </div>

                            {/* Pet Type */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Pet Type *
                                </label>
                                <select
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    value={petType}
                                    required
                                    onChange={(e) =>
                                        setPetType(e.target.value)
                                    }>
                                    <option value="">Select pet type</option>
                                    {categories.map((category) => (
                                        <option
                                            key={category.category_id}
                                            value={category.category_id}>
                                            {category.category_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* City */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    City *
                                </label>
                                <select
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    value={cityId}
                                    required
                                    onChange={(e) => setCityId(e.target.value)}>
                                    <option value="">Select City</option>
                                    {cities.map((city) => (
                                        <option
                                            key={city.city_id}
                                            value={city.city_id}>
                                            {city.city_name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Area */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Area/Neighborhood *
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    placeholder="Enter your area or neighborhood"
                                    value={area}
                                    onChange={(e) => setArea(e.target.value)}
                                />
                            </div>

                            {/* Sex */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Sex *
                                </label>
                                <select
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    value={sex}
                                    onChange={(e) => setSex(e.target.value)}>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="unknown">Unknown</option>
                                </select>
                            </div>

                            {/* Age and Months */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Age (Years) *
                                    </label>
                                    <input
                                        type="number"
                                        className="mt-1 p-3 w-full border rounded-2xl input-field"
                                        placeholder="Years"
                                        value={age ?? ""}
                                        onChange={handleAgeChange}
                                    />
                                    {ageError && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {ageError}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">
                                        Age (Months) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="11"
                                        className="mt-1 p-3 w-full border rounded-2xl input-field"
                                        placeholder="Months (0-11)"
                                        value={months ?? ""}
                                        onChange={handleMonthsChange}
                                    />
                                    {monthsError && (
                                        <p className="text-red-500 text-xs mt-1">
                                            {monthsError}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Price */}
                            {/* <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Price
                                </label>
                                <input
                                    type="text"
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    placeholder="Enter price if selling"
                                    value={price}
                                    onChange={handlePriceChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Leave empty for adoption listings
                                </p>
                            </div> */}

                            {price && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Payment Frequency
                                    </label>
                                    <select
                                        className="mt-1 p-3 w-full border rounded-2xl input-field"
                                        value={paymentFrequency}
                                        onChange={(e) =>
                                            setPaymentFrequency(e.target.value)
                                        }>
                                        <option value="day">Daily</option>
                                        <option value="week">Weekly</option>
                                        <option value="month">Monthly</option>
                                        <option value="year">Yearly</option>
                                    </select>
                                </div>
                            )}

                            {/* Description */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">
                                    Description
                                </label>
                                <textarea
                                    className="mt-1 p-3 w-full border rounded-2xl input-field"
                                    placeholder="Tell potential adopters about the pet(s) - personality, history, special needs, etc."
                                    rows={3}
                                    value={description}
                                    onChange={(e) =>
                                        setDescription(e.target.value)
                                    }></textarea>
                            </div>

                            {/* Additional Details Accordion */}
                            <Collapse className="mb-6" defaultActiveKey={[]}>
                                <Panel
                                    className=""
                                    header="Additional Details"
                                    key="1">
                                    {/* Breed */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Breed
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 p-3 w-full border rounded-2xl input-field"
                                            placeholder="Enter breed if known"
                                            value={breed}
                                            onChange={(e) =>
                                                setBreed(e.target.value)
                                            }
                                        />
                                    </div>

                                    {/* Vaccinated & Neutered */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={vaccinated}
                                                onChange={(e) =>
                                                    setVaccinated(
                                                        e.target.checked
                                                    )
                                                }
                                                className="mr-2"
                                            />
                                            Vaccinated
                                        </label>
                                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={neutered}
                                                onChange={(e) =>
                                                    setNeutered(
                                                        e.target.checked
                                                    )
                                                }
                                                className="mr-2"
                                            />
                                            Neutered/Spayed
                                        </label>
                                    </div>

                                    {/* Compatibility */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Compatibility
                                        </label>
                                        <div className="space-y-2">
                                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={canLiveWithDogs}
                                                    onChange={(e) =>
                                                        setCanLiveWithDogs(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="mr-2"
                                                />
                                                Can live with dogs
                                            </label>
                                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={canLiveWithCats}
                                                    onChange={(e) =>
                                                        setCanLiveWithCats(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="mr-2"
                                                />
                                                Can live with cats
                                            </label>
                                            <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={
                                                        mustHaveSomeoneHome
                                                    }
                                                    onChange={(e) =>
                                                        setMustHaveSomeoneHome(
                                                            e.target.checked
                                                        )
                                                    }
                                                    className="mr-2"
                                                />
                                                Needs someone home most of the
                                                time
                                            </label>
                                        </div>
                                    </div>

                                    {/* Energy Level */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Energy Level
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                className="mt-2 w-full appearance-none h-2 rounded-lg bg-gray-300"
                                                value={energyLevel ?? 3}
                                                onChange={(e) =>
                                                    handleEnergyLevelChange(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                style={{
                                                    background: energyLevel !== null
                                                        ? `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${
                                                              ((energyLevel ?? 3) - 1) *
                                                              25
                                                          }%, #D1D5DB ${
                                                              ((energyLevel ?? 3) - 1) *
                                                              25
                                                          }%, #D1D5DB 100%)`
                                                        : "#D1D5DB",
                                                }}
                                            />
                                            <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                                                <span>Chilled</span>
                                                <span>Hyper</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Cuddliness Level */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Cuddliness Level
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                className="mt-2 w-full appearance-none h-2 rounded-lg bg-gray-300"
                                                value={cuddlinessLevel ?? 3}
                                                onChange={(e) =>
                                                    handleCuddlinessLevelChange(
                                                        Number(e.target.value)
                                                    )
                                                }
                                                style={{
                                                    background: cuddlinessLevel !== null
                                                        ? `linear-gradient(to right, var(--primary-color) 0%, var(--primary-color) ${
                                                              ((cuddlinessLevel ?? 3) - 1) *
                                                              25
                                                          }%, #D1D5DB ${
                                                              ((cuddlinessLevel ?? 3) - 1) *
                                                              25
                                                          }%, #D1D5DB 100%)`
                                                        : "#D1D5DB",
                                                }}
                                            />
                                            <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                                                <span>Independent</span>
                                                <span>Cuddler</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Health Issues */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Known Health Issues
                                        </label>
                                        <input
                                            type="text"
                                            className="mt-1 p-3 w-full border rounded-2xl input-field"
                                            placeholder="Describe any health issues"
                                            value={healthIssues}
                                            onChange={(e) =>
                                                setHealthIssues(e.target.value)
                                            }
                                        />
                                    </div>
                                </Panel>
                            </Collapse>

                            <button
                                type="button"
                                onClick={nextStep}
                                className="mt-4 p-3 bg-primary text-white rounded-3xl w-full">
                                Next
                            </button>
                        </>
                    ) : (
                        <>
                            {/* Upload Images */}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Upload Images (Maximum 5)
                                </label>
                                <Upload
                                    action=""
                                    listType="picture-card"
                                    fileList={fileList}
                                    onPreview={handlePreview}
                                    onChange={handleChange}
                                    beforeUpload={beforeUpload}
                                    maxCount={5}>
                                    {fileList.length >= 5 ? null : uploadButton}
                                </Upload>
                                {previewImage && (
                                    <Image
                                        wrapperStyle={{ display: "none" }}
                                        preview={{
                                            visible: previewOpen,
                                            onVisibleChange: (visible) =>
                                                setPreviewOpen(visible),
                                            afterOpenChange: (visible) =>
                                                !visible && setPreviewImage(""),
                                        }}
                                        src={previewImage}
                                    />
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="mt-4 p-3 bg-gray-300 text-gray-700 rounded-3xl w-full">
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="mt-4 p-3 bg-primary text-white rounded-3xl w-full disabled:bg-gray-400"
                                    disabled={isSubmitting}>
                                    {isSubmitting
                                        ? "Creating Listing..."
                                        : "Create Listing"}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </>
    );
}