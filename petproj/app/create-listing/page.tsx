"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { fetchPetCategories } from "../store/slices/petCategoriesSlice"; // Fetch pet categories from store
import { postPet } from "../store/slices/petSlice"; // Import postPet thunk

import Navbar from "@/components/navbar";

export default function CreatePetListing() {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    // State for form fields
    const [listingType, setListingType] = useState("");
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
            ...(listingType === "foster" && {
                payment_frequency: paymentFrequency || null,
            }),
        };

        console.log(newPet);
        // Dispatch postPet action
        dispatch(postPet(newPet));
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
                        <label className="block text-sm font-medium text-gray-700">
                            Listing Type
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-lg"
                            value={listingType}
                            onChange={(e) => setListingType(e.target.value)}>
                            <option value="adoption">Adoption</option>
                            <option value="foster">Foster</option>
                        </select>
                    </div>

                    {/* Pet Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Name
                        </label>
                        <input
                            type="text"
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

                    {/* Age */}
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
                    </div>

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
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                    )}

                    {/* Minimum Age of Children */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Minimum Age of Children
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter minimum age"
                            value={minAgeOfChildren}
                            onChange={(e) =>
                                setMinAgeOfChildren(Number(e.target.value))
                            }
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="checkbox" className="mr-2" />
                            Can live with dogs
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="checkbox" className="mr-2" />
                            Can live with cats
                        </label>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 cursor-pointer">
                            <input type="checkbox" className="mr-2" />
                            Must have someone home
                        </label>
                    </div>

                    {/* Energy Level */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Energy Level
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter energy level (1-5)"
                            value={energyLevel}
                            onChange={(e) =>
                                setEnergyLevel(Number(e.target.value))
                            }
                        />
                    </div>

                    {/* Cuddliness Level */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Cuddliness Level
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter cuddliness level (1-5)"
                            value={cuddlinessLevel}
                            onChange={(e) =>
                                setCuddlinessLevel(Number(e.target.value))
                            }
                        />
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

                    {/* Sex */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Sex
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-lg"
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    {/* Vaccinated */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                        <input
                            type="checkbox"
                            checked={vaccinated}
                            onChange={(e) => setVaccinated(e.target.checked)}
                            className="mr-2"
                        />
                            Vaccinated
                        </label>
                        
                    </div>

                    {/* Neutered */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={neutered}
                                onChange={(e) => setNeutered(e.target.checked)}
                                className="mr-2"
                            />
                            Neutered
                        </label>
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
