"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { fetchPetCategories } from "../store/slices/petCategoriesSlice"; // Fetch pet categories from store

import Navbar from "@/components/navbar";

export default function CreatePetListing() {
    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities);
    const { categories } = useSelector((state: RootState) => state.categories);

    useEffect(() => {
        // Dispatch fetch actions to load cities and pet categories from the store
        dispatch(fetchCities());
        dispatch(fetchPetCategories());
    }, [dispatch]);

    return (
        <>
            <Navbar />
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                <form className="bg-white p-6 rounded-xl shadow-md w-full max-w-lg mx-auto my-8">
                    {/* Pet Name */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Name
                        </label>
                        <input
                            type="text"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter pet name"
                        />
                    </div>

                    {/* Pet Type (Dynamic Dropdown) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Type
                        </label>
                        <select className="mt-1 p-3 w-full border rounded-lg">
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
                        />
                    </div>

                    {/* City (Dynamic Dropdown) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            City
                        </label>
                        <select className="mt-1 p-3 w-full border rounded-lg">
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
                        />
                    </div>

                    {/* Remaining fields... */}
                    {/* Age */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Age (Years)
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter age"
                        />
                    </div>

                    {/* Description */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Description
                        </label>
                        <textarea
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Describe the pet"></textarea>
                    </div>

                    {/* Adoption Status */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Adoption Status
                        </label>
                        <select className="mt-1 p-3 w-full border rounded-lg">
                            <option value="available">Available</option>
                            <option value="adopted">Adopted</option>
                        </select>
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
                        />
                    </div>

                    {/* Minimum Age of Children */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Minimum Age of Children
                        </label>
                        <input
                            type="number"
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter minimum age"
                        />
                    </div>

                    {/* Can Live With Other Animals */}
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

                    {/* Energy Level Slider */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Energy Level
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            className="mt-2 w-full"
                            defaultValue="3" // Set the default value (optional)
                            onChange={(e) => console.log(e.target.value)} // Optional: Handle the change
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <span>Low</span>

                            <span>High</span>
                        </div>
                    </div>

                    {/* Cuddliness Level */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Cuddliness Level
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="5"
                            className="mt-2 w-full"
                            defaultValue="3" // Set the default value (optional)
                            onChange={(e) => console.log(e.target.value)} // Optional: Handle the change
                        />
                        <div className="flex justify-between mt-2 text-sm text-gray-500">
                            <span>Low</span>
                            <span>High</span>
                        </div>
                    </div>

                    {/* Health Issues */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Health Issues
                        </label>
                        <textarea
                            className="mt-1 p-3 w-full border rounded-lg"
                            placeholder="Enter health issues (if any)"></textarea>
                    </div>

                    {/* Sex */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Sex
                        </label>
                        <select className="mt-1 p-3 w-full border rounded-lg">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                        </select>
                    </div>

                    {/* Listing Type */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Listing Type
                        </label>
                        <select className="mt-1 p-3 w-full border rounded-lg">
                            <option value="adoption">Adoption</option>
                            <option value="foster">Foster</option>
                        </select>
                    </div>

                    {/* Vaccinated and Neutered */}
                    <div className="flex space-x-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                <input type="checkbox" className="mt-1 mr-2" />
                                Vaccinated
                            </label>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                <input type="checkbox" className="mt-1 mr-2" />
                                Neutered
                            </label>
                        </div>
                    </div>

                    {/* ... */}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="bg-[#A03048] text-white w-full py-3 rounded-lg font-medium hover:bg-[#90223f]">
                        Submit
                    </button>
                </form>
            </div>
        </>
    );
}
