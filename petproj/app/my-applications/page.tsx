'use client';
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";

interface Application {
    application_type: "foster" | "adoption";
    application_id: string;
    pet_id: string;
    status: string;
    created_at: string;
    pet_name: string;
    breed: string;
    city_name: string;
    area: string;
    age: number;
    adoption_status: string;
    image_url: string;
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchApplications = async () => {
            try {
                const userString = localStorage.getItem("user");
                if (!userString) {
                    setError("User data not found in local storage");
                    setLoading(false);
                    return;
                }

                const user = JSON.parse(userString);
                const user_id = user?.id;
                if (!user_id) {
                    setError("User ID is missing from the user object");
                    setLoading(false);
                    return;
                }

                const response = await fetch(`/api/get-my-applications/${user_id}`);
                if (!response.ok) {
                    const { error } = await response.json();
                    setError(error || "Failed to fetch applications");
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                setApplications(data.applications);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching applications:", err);
                setError("An unexpected error occurred");
                setLoading(false);
            }
        };

        fetchApplications();
    }, []);

    const handleDeleteApplication = async (applicationId: string) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this application? This action cannot be undone."
        );
        if (!confirmDelete) return;

        try {
            const response = await fetch(`/api/delete-application/${applicationId}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const { error } = await response.json();
                alert(error || "Failed to delete application");
                return;
            }

            // Remove the deleted application from the state
            setApplications((prevApplications) =>
                prevApplications.filter((app) => app.application_id !== applicationId)
            );

            alert("Application deleted successfully.");
        } catch (err) {
            console.error("Error deleting application:", err);
            alert("An unexpected error occurred while deleting the application.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-lg font-medium text-gray-700">
                    Loading your applications...
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-red-500 text-lg font-medium">{error}</p>
            </div>
        );
    }

    return (
        <>
            <Navbar />
            <div className="max-w-4xl min-h-screen mx-auto py-10 px-4">
                <h1 className="text-2xl font-bold text-gray-800 mb-6">
                    My Applications
                </h1>
                {applications.length === 0 ? (
                    <p className="text-gray-600 text-center">
                        No applications found.
                    </p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {applications.map((app) => (
                            <div
                                key={app.application_id}
                                className="bg-white border border-gray-200 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
                            >
                                <img
                                    src={app.image_url || "/placeholder.jpg"}
                                    alt={app.pet_name}
                                    className="w-full h-40 object-cover rounded-md mb-4"
                                />
                                <h3 className="text-lg font-semibold text-gray-800">
                                    {app.application_type === "foster"
                                        ? "Foster Application"
                                        : "Adoption Application"}
                                </h3>
                                <p className="text-gray-600">
                                    <strong>Pet Name:</strong> {app.pet_name}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Breed:</strong> {app.breed}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Location:</strong>{" "}
                                    {`${app.city_name}, ${app.area}`}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Age:</strong> {app.age}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Adoption Status:</strong>{" "}
                                    {app.adoption_status}
                                </p>
                                <p className="text-gray-600">
                                    <strong>Status:</strong>{" "}
                                    <span
                                        className={`px-2 py-1 rounded ${
                                            app.status === "pending"
                                                ? "bg-yellow-100 text-yellow-700"
                                                : app.status === "approved"
                                                ? "bg-green-100 text-green-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {app.status}
                                    </span>
                                </p>
                                <p className="text-gray-600">
                                    <strong>Created At:</strong>{" "}
                                    {new Date(app.created_at).toLocaleDateString()}
                                </p>
                                <button
                                    className="mt-4 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors"
                                    onClick={() => handleDeleteApplication(app.application_id)}
                                >
                                    Delete Application
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
