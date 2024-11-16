"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { fetchPetCategories } from "../store/slices/petCategoriesSlice"; // Fetch pet categories from store
import { postPet } from "../store/slices/petSlice"; // Import postPet thunk

import Navbar from "@/components/navbar";
import "./styles.css";

import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload } from "antd";
import type { GetProp, UploadFile, UploadProps } from "antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const getBase64 = (file: FileType): Promise<string> =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });

export default function CreatePetListing() {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    // State for form fields
    const [listingType, setListingType] = useState<"adoption" | "foster">(
        "adoption"
    );
    const [petName, setPetName] = useState("");
    const [petType, setPetType] = useState("");
    const [breed, setBreed] = useState("");
    const [cityId, setCityId] = useState("");
    const [area, setArea] = useState("");
    const [age, setAge] = useState(0);
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState("");
    const [minAgeOfChildren, setMinAgeOfChildren] = useState(0);
    const [canLiveWithDogs, setCanLiveWithDogs] = useState(false);
    const [canLiveWithCats, setCanLiveWithCats] = useState(false);
    const [mustHaveSomeoneHome, setMustHaveSomeoneHome] = useState(false);
    const [energyLevel, setEnergyLevel] = useState(3);
    const [cuddlinessLevel, setCuddlinessLevel] = useState(3);
    const [healthIssues, setHealthIssues] = useState("");
    const [sex, setSex] = useState("male");
    const [vaccinated, setVaccinated] = useState(false);
    const [neutered, setNeutered] = useState(false);
    const [paymentFrequency, setPaymentFrequency] = useState("");
    const [fileList, setFileList] = useState<UploadFile[]>([]); // State for uploaded files
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");

    useEffect(() => {
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    // Handle form submission
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const newPet = {
            owner_id: 1, // Replace with the actual owner ID if available
            pet_name: petName || null,
            pet_type: petType ? Number(petType) : null,
            pet_breed: breed || null,
            city_id: cityId ? Number(cityId) : null,
            area: area || "",
            age: age || null,
            description: description || null,
            adoption_status: "available",
            price: price ? Number(price) : null,
            min_age_of_children: minAgeOfChildren || null,
            can_live_with_dogs: canLiveWithDogs,
            can_live_with_cats: canLiveWithCats,
            must_have_someone_home: mustHaveSomeoneHome,
            energy_level: energyLevel || 3,
            cuddliness_level: cuddlinessLevel || 3,
            health_issues: healthIssues || null,
            sex: sex || "male",
            listing_type: listingType || "adoption",
            vaccinated,
            neutered,
            images: fileList.map((file) => file.originFileObj), // Attach the uploaded images
            payment_frequency: paymentFrequency || null,
        };

        console.log(newPet);
        // Dispatch postPet action
        dispatch(postPet(newPet));
    };

    const handlePreview = async (file: UploadFile) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj as FileType);
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

    const handleTabToggle = (type: "adoption" | "foster") => {
        setListingType(type);
    };

    return (
        <>
            <Navbar />
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <form
                    className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg mx-auto my-8"
                    onSubmit={handleSubmit}>
                    {/* Listing Type */}
                    <div className="mb-4">
                        <div className="w-3/4 tab-switch-container mt-1">
                            {/* Sliding background for active tab */}
                            <div
                                className="tab-switch-slider"
                                style={{
                                    transform:
                                        listingType === "adoption"
                                            ? "translateX(0)"
                                            : "translateX(100%)",
                                }}
                            />
                            {/* Tabs */}
                            <div
                                className={`tab ${
                                    listingType === "adoption" ? "active" : ""
                                }`}
                                onClick={() => handleTabToggle("adoption")}>
                                Adopt
                            </div>
                            <div
                                className={`tab ${
                                    listingType === "foster" ? "active" : ""
                                }`}
                                onClick={() => handleTabToggle("foster")}>
                                Foster
                            </div>
                        </div>
                    </div>

                    {/* Pet Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Name
                        </label>
                        <input
                            type="text"
                            required
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter pet name"
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                        />
                    </div>

                    {/* Pet Type (Dynamic Dropdown) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Type
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-lg"
                            value={petType}
                            required
                            onChange={(e) => setPetType(e.target.value)}>
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

                    {/* Pet Breed */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Breed
                        </label>
                        <input
                            type="text"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter breed"
                            value={breed}
                            onChange={(e) => setBreed(e.target.value)}
                        />
                    </div>

                    {/* City (Dynamic Dropdown) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            City
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-lg"
                            value={cityId}
                            required
                            onChange={(e) => setCityId(e.target.value)}>
                            <option value="">Select City</option>
                            {cities.map((city) => (
                                <option key={city.city_id} value={city.city_id}>
                                    {city.city_name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Area */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Area
                        </label>
                        <input
                            type="text"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter area"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                        />
                    </div>

                    {/* Age (Years) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Age (Years)
                        </label>
                        <input
                            type="text" // Change to text for free input
                            required
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter age" // Ensure 0 is not in the placeholder
                            value={age || ""} // Prevent "0" from showing in the input field
                            onChange={(e) => {
                                const value = e.target.value;
                                // Convert to number; default to 0 if empty or undefined
                                const numberValue = value ? Number(value) : 0;
                                setAge(numberValue);
                            }}
                        />
                    </div>

                    {/* Sex */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Sex
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-lg"
                            value={sex}
                            required
                            onChange={(e) => setSex(e.target.value)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    {/* Age
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Age (Years)
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter age"
                            value={age}
                            onChange={(e) => setAge(Number(e.target.value))}
                        />
                    </div> */}

                    {/* Vaccinated */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={vaccinated}
                                onChange={(e) =>
                                    setVaccinated(e.target.checked)
                                }
                                className="mr-2"
                            />
                            Vaccinated
                        </label>
                    </div>

                    {/* Neutered */}
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={neutered}
                                onChange={(e) => setNeutered(e.target.checked)}
                                className="mr-2"
                            />
                            Neutered
                        </label>
                    </div>

                    {/* Price */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Price
                        </label>
                        <input
                            type="text"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter price (if applicable)"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                    </div>

                    {listingType === "foster" && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Payment Frequency
                            </label>
                            <select
                                className="mt-1 p-3 w-full border rounded-lg"
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

                    {/* Minimum Age of Children
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Minimum Age of Children
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter minimum age"
                            value={minAgeOfChildren}
                            onChange={(e) => setMinAgeOfChildren(Number(e.target.value))} // Use the raw value instead of converting to Number
                        />
                    </div> */}

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Describe the pet"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }></textarea>
                    </div>

                    {/* Minimum Age of Children*/}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Minimum Age of Children
                        </label>
                        <input
                            type="text" // Keep input type as text
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter minimum age"
                            value={minAgeOfChildren || ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                const numberValue = value ? Number(value) : 0;
                                setMinAgeOfChildren(numberValue);
                            }}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={canLiveWithDogs}
                                onChange={(e) =>
                                    setCanLiveWithDogs(e.target.checked)
                                }
                                className="mr-2"
                            />
                            Can live with dogs
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={canLiveWithCats}
                                onChange={(e) =>
                                    setCanLiveWithCats(e.target.checked)
                                }
                                className="mr-2"
                            />
                            Can live with cats
                        </label>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center text-sm font-medium text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={mustHaveSomeoneHome}
                                onChange={(e) =>
                                    setMustHaveSomeoneHome(e.target.checked)
                                }
                                className="mr-2"
                            />
                            Must have someone home
                        </label>
                    </div>

                    {/* Energy Level Slider */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Energy Level
                        </label>
                        <div className="relative">
                            <input
                                type="range"
                                min="1"
                                max="5"
                                className="mt-2 w-full"
                                value={energyLevel ?? 3} // Show 3 as a visual placeholder but don't set it as state
                                onChange={(e) =>
                                    setEnergyLevel(Number(e.target.value))
                                }
                                onMouseDown={() => {
                                    if (energyLevel === null) setEnergyLevel(3); // Set to 3 when user interacts
                                }}
                                style={{
                                    background: energyLevel
                                        ? `linear-gradient(to right, #A03048 0%, #A03048 ${
                                              (energyLevel - 1) * 25
                                          }%, #D1D5DB ${
                                              (energyLevel - 1) * 25
                                          }%, #D1D5DB 100%)`
                                        : "#D1D5DB", // Default background when unselected
                                }}
                            />
                            <div className="w-full flex justify-between -top-2">
                                <span className="text-sm text-gray-500">
                                    Chilled
                                </span>
                                <span className="text-sm text-gray-500">
                                    Hyper
                                </span>
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
                                className="mt-2 w-full h-2 rounded-lg bg-gray-300 appearance-none"
                                value={cuddlinessLevel ?? 3} // Show 3 visually, but don't persist
                                onChange={(e) =>
                                    setCuddlinessLevel(Number(e.target.value))
                                }
                                onMouseDown={() => {
                                    if (cuddlinessLevel === null)
                                        setCuddlinessLevel(3); // Set to 3 when user interacts
                                }}
                                style={{
                                    background: cuddlinessLevel
                                        ? `linear-gradient(to right, #A03048 0%, #A03048 ${
                                              (cuddlinessLevel - 1) * 25
                                          }%, #D1D5DB ${
                                              (cuddlinessLevel - 1) * 25
                                          }%, #D1D5DB 100%)`
                                        : "#D1D5DB", // Default background
                                }}
                            />
                            <div className="w-full flex justify-between mt-2 text-sm text-gray-500">
                                <span>Cuddler</span>
                                <span>Independent</span>
                            </div>
                        </div>
                    </div>

                    {/* Health Issues */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Health Issues
                        </label>
                        <input
                            type="text"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter health issues"
                            value={healthIssues}
                            onChange={(e) => setHealthIssues(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Upload Images (Max 5)
                        </label>
                        <Upload
                            action=""
                            listType="picture-card"
                            fileList={fileList}
                            onPreview={handlePreview}
                            onChange={handleChange}
                            maxCount={5} // Limit to 5 images
                        >
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

                    <button
                        type="submit"
                        className="mt-4 p-3 bg-primary text-white rounded-lg w-full">
                        Create Listing
                    </button>
                </form>
            </div>
        </>
    );
}
