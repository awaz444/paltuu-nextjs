"use client";

import { useState } from "react";
import "./styles.css";
import Navbar from "@/components/navbar";

const LostFoundListingPage = () => {
    const [petName, setPetName] = useState("");
    const [petType, setPetType] = useState("");
    const [age, setAge] = useState<number | string>("");
    const [cityId, setCityId] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [dateLost, setDateLost] = useState("");
    const [contactInfo, setContactInfo] = useState("");
    const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");

    // **City Options**
    const cities = [
        { id: 1, name: "Karachi" },
        { id: 2, name: "Islamabad" },
        { id: 3, name: "Lahore" },
    ];

    // **Pet Categories**
    const petCategories = [
        { id: 1, name: "Dog" },
        { id: 2, name: "Cat" },
        { id: 3, name: "Bird" },
        { id: 4, name: "Fish" },
        { id: 5, name: "Rabbit" },
        { id: 6, name: "Hamster" },
        { id: 7, name: "Guinea Pig" },
        { id: 8, name: "Turtle" },
        { id: 11, name: "Horse" },
        { id: 15, name: "Mouse" },
    ];

    // **Handle form submission**
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Collect the form data
        const formData = {
            pet_name: petName,
            pet_type: petType,
            age: age,
            city_id: parseInt(cityId), // Convert to integer before sending
            location: location,
            description: description,
            date_lost: activeTab === "lost" ? dateLost : null, // Only include date_lost if "Lost" is active
            contact_info: contactInfo,
            post_type: activeTab, // This will be either "lost" or "found"
        };

        console.log('Form Data:', formData); // Debugging log

        // **API Call to submit form data**
        fetch("/api/lost-and-found", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        })
            .then((response) => response.json())
            .then((data) => {
                console.log("Success:", data);
                // Reset form after successful submission
                resetForm();
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    };

    // **Reset form fields**
    const resetForm = () => {
        setPetName("");
        setPetType("");
        setAge("");
        setCityId("");
        setLocation("");
        setDescription("");
        setDateLost("");
        setContactInfo("");
    };

    // **Toggle between Lost and Found tabs**
    const handleTabToggle = (tab: "lost" | "found") => {
        setActiveTab(tab);
    };

    return (
        <>
            <Navbar />
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}
            >
                <form
                    className="bg-white p-6 rounded-3xl shadow-md w-full max-w-lg mx-auto my-8"
                    onSubmit={handleSubmit}
                >
                    {/* **Tab Switch** */}
                    <div className="tab-switch-container mb-6">
                        <div
                            className="tab-switch-slider bg-primary"
                            style={{
                                transform:
                                    activeTab === "lost"
                                        ? "translateX(0)"
                                        : "translateX(100%)",
                            }}
                        />
                        <div
                            className={`tab ${
                                activeTab === "lost" ? "active" : ""
                            }`}
                            onClick={() => handleTabToggle("lost")}
                        >
                            Lost
                        </div>
                        <div
                            className={`tab ${
                                activeTab === "found" ? "active" : ""
                            }`}
                            onClick={() => handleTabToggle("found")}
                        >
                            Found
                        </div>
                    </div>

                    {/* **Pet Name** */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Name
                        </label>
                        <input
                            type="text"
                            required
                            className="mt-1 p-3 w-full border rounded-2xl"
                            placeholder="Enter pet name"
                            value={petName}
                            onChange={(e) => setPetName(e.target.value)}
                        />
                    </div>

                    {/* **Pet Type** */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Pet Type
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-2xl"
                            value={petType}
                            required
                            onChange={(e) => setPetType(e.target.value)}
                        >
                            <option value="">Select pet type</option>
                            {petCategories.map((category) => (
                                <option key={category.id} value={category.name}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* **City** */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            City
                        </label>
                        <select
                            className="mt-1 p-3 w-full border rounded-2xl"
                            value={cityId}
                            required
                            onChange={(e) => setCityId(e.target.value)}
                        >
                            <option value="">Select city</option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* **Location** */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <input
                            type="text"
                            required
                            className="mt-1 p-3 w-full border rounded-2xl"
                            placeholder="Enter specific location"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        />
                    </div>

                    {/* **Date Lost** (only when Lost tab is active) */}
                    {activeTab === "lost" && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700">
                                Date Lost
                            </label>
                            <input
                                type="date"
                                className="mt-1 p-3 w-full border rounded-2xl"
                                value={dateLost}
                                onChange={(e) => setDateLost(e.target.value)}
                            />
                        </div>
                    )}

                    {/* **Contact Info** */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Contact Information
                        </label>
                        <input
                            type="text"
                            required
                            className="mt-1 p-3 w-full border rounded-2xl"
                            placeholder="Enter contact details"
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                        />
                    </div>

                    <button
                        type="submit"
                        className="mt-4 p-3 bg-primary text-white rounded-3xl w-full"
                    >
                        Submit Listing
                    </button>
                </form>
            </div>
        </>
    );
};

export default LostFoundListingPage;
