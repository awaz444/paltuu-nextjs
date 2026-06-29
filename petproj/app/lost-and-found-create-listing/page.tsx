"use client";

import { useState, useEffect } from "react";
import "./styles.css";
import { useRouter } from "next/navigation";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";
import LoginModal from "@/components/LoginModal";

const LostFoundListingPage = () => {
    const { user, isAuthenticated, isHydrating } = useAuth();
    const [categoryId, setCategoryId] = useState<number | string>("");
    const [cityId, setCityId] = useState("");
    const [location, setLocation] = useState("");
    const [description, setDescription] = useState("");
    const [date, setDate] = useState("");
    const [contactInfo, setContactInfo] = useState("");
    const [activeTab, setActiveTab] = useState<"lost" | "found">("lost");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [showLoginModal, setShowLoginModal] = useState(false);

    const router = useRouter();
    const userId = user?.id || (user as any)?.user_id;

    useEffect(() => {
        if (!isHydrating) {
            setShowLoginModal(!isAuthenticated);
        }
    }, [isAuthenticated, isHydrating]);

    const cities = [
        { id: 1, name: "Karachi" },
        { id: 2, name: "Islamabad" },
        { id: 3, name: "Lahore" },
    ];

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userId) {
            setShowLoginModal(true);
            return;
        }

        setLoading(true);
        setError(null);

        const formData = {
            category_id: categoryId,
            city_id: parseInt(cityId),
            location,
            pet_description: description || null,
            date: activeTab === "lost" ? date : null,
            contact_info: contactInfo,
            post_type: activeTab,
            user_id: userId,
        };

        try {
            const response = await fetch("/api/v1/lost-and-found", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (response.ok) {
                const postId = data?.post_id;
                if (postId) {
                    router.push(`/lost-and-found-images?post_id=${postId}`);
                } else {
                    setError("Failed to get post ID from response.");
                }
                resetForm();
            } else {
                setError(data?.message || "Failed to submit listing");
            }
        } catch {
            setError("An error occurred while submitting the listing");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setCategoryId("");
        setCityId("");
        setLocation("");
        setDescription("");
        setDate("");
        setContactInfo("");
    };

    return (
        <>
            <LoginModal
                visible={showLoginModal}
                onSuccess={() => setShowLoginModal(false)}
                onClose={() => setShowLoginModal(false)}
                mandatory={!isAuthenticated}
            />

            <main className="min-h-screen bg-gray-100">
                {/* Slim banner */}
                <div className="bg-white border-b border-gray-100">
                    <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8 text-center">
                        <p className="text-gray-500 text-sm">
                            Help reunite pets with their families —{" "}
                            <span className="font-semibold text-primary">report a lost or found pet</span>
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-10 px-4 md:px-8">
                    <form
                        className="bg-white p-8 rounded-3xl shadow-sm w-full max-w-lg mx-auto"
                        onSubmit={handleSubmit}
                    >
                        {/* Lost / Found tab */}
                        <div className="tab-switch-container mb-6">
                            <div
                                className="tab-switch-slider bg-primary"
                                style={{ transform: activeTab === "lost" ? "translateX(0)" : "translateX(100%)" }}
                            />
                            <div className={`tab ${activeTab === "lost" ? "active" : ""}`} onClick={() => setActiveTab("lost")}>
                                Lost
                            </div>
                            <div className={`tab ${activeTab === "found" ? "active" : ""}`} onClick={() => setActiveTab("found")}>
                                Found
                            </div>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Pet Category */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Category</label>
                            <select
                                className="p-3 w-full border rounded-2xl bg-white"
                                value={categoryId}
                                required
                                onChange={(e) => setCategoryId(e.target.value)}
                            >
                                <option value="">Select pet category</option>
                                {petCategories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* City */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                            <select
                                className="p-3 w-full border rounded-2xl bg-white"
                                value={cityId}
                                required
                                onChange={(e) => setCityId(e.target.value)}
                            >
                                <option value="">Select city</option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>{city.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Location */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                            <input
                                type="text"
                                className="p-3 w-full border rounded-2xl"
                                placeholder="Enter specific location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                        </div>

                        {/* Pet Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet Description</label>
                            <textarea
                                className="p-3 w-full border rounded-2xl resize-none"
                                placeholder="Describe the pet — colour, size, markings, collar, etc."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={4}
                            />
                        </div>

                        {/* Date */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {activeTab === "lost" ? "Date Lost" : "Date Found"}
                            </label>
                            <input
                                type="date"
                                className="p-3 w-full border rounded-2xl"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>

                        {/* Contact Info */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                            <input
                                type="text"
                                required
                                className="p-3 w-full border rounded-2xl"
                                placeholder="Phone number or email"
                                value={contactInfo}
                                onChange={(e) => setContactInfo(e.target.value)}
                            />
                        </div>

                        <button
                            type="submit"
                            className="p-3 bg-primary text-white rounded-2xl w-full font-medium disabled:opacity-60"
                            disabled={loading}
                        >
                            {loading ? "Submitting..." : "Submit Listing"}
                        </button>
                    </form>
                </div>
            </main>
        </>
    );
};

export default LostFoundListingPage;
