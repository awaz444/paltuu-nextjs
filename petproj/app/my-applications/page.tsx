"use client";
import { useEffect, useState } from "react";
import Navbar from "@/components/navbar";
import { MoonLoader } from "react-spinners";
import { useSetPrimaryColor } from "@/app/hooks/useSetPrimaryColor";
import { useAuth } from "@/context/AuthContext";
import { useSession } from "next-auth/react";
import { getMyApplicationsApi, deleteAdoptionApplicationApi } from "@/utils/api";

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
    const [primaryColor, setPrimaryColor] = useState("#000000");

    const { user, isAuthenticated } = useAuth();
    const { status } = useSession();

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    const fetchApplications = async () => {
        if (!isAuthenticated || !user) {
            setError("You must be logged in to view your applications.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const data = await getMyApplicationsApi();

            // Map NestJS response to Application interface
            // NestJS returns a list of applications directly or in a results/data field
            const apps = Array.isArray(data) ? data : data.data || data.applications || [];

            const mappedApps: Application[] = apps.map((app: any) => ({
                application_id: app.application_id,
                application_type: app.application_type,
                pet_id: app.pet_id,
                status: app.status,
                created_at: app.created_at,
                pet_name: app.pets?.pet_name || app.pet_name || "Unknown Pet",
                breed: app.pets?.pet_breed || app.breed || "",
                city_name: app.pets?.cities?.city_name || app.city_name || "",
                area: app.pets?.area || app.area || "",
                age: app.pets?.age || app.age || 0,
                adoption_status: app.pets?.adoption_status || app.adoption_status || "",
                image_url: app.pets?.pet_images?.[0]?.image_url || app.image_url || "",
            }));

            setApplications(mappedApps);
        } catch (err: any) {
            console.error("Error fetching applications:", err);
            setError(err.message || "An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Only fetch applications when auth state is determined and user is authenticated
        if (status !== "loading") {
            fetchApplications();
        }
    }, [isAuthenticated, user, status]);

    const handleDeleteApplication = async (
        applicationId: string
    ) => {
        const confirmDelete = window.confirm(
            "Are you sure you want to delete this application? This action cannot be undone."
        );
        if (!confirmDelete) return;

        try {
            await deleteAdoptionApplicationApi(applicationId);

            // Remove the deleted application from the state
            setApplications((prevApplications) =>
                prevApplications.filter(
                    (app) => app.application_id !== applicationId
                )
            );

            alert("Application deleted successfully.");
        } catch (err: any) {
            console.error("Error deleting application:", err);
            alert(err.message || "An unexpected error occurred while deleting the application.");
        }
    };

    // Show loading state while authentication is being determined
    if (status === "loading") {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    // Show authentication error if user is not authenticated
    if (!isAuthenticated || !user) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500 text-lg font-medium">
                    You must be logged in to view your applications. Please log in and try again.
                </p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <p className="text-red-500 text-lg font-medium">{error}</p>
            </div>
        );
    }

    return (
        <>

            <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
                {/* Updated Header */}
                <header className="bg-white text-primary border border-1 border-primary p-8 rounded-2xl shadow-lg mb-10">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="bg-primary flex-shrink-0 w-16 h-16 rounded-xl bg-white/20 flex items-center justify-center shadow-lg">
                            <img className="p-3" src="/favicon-dark.png" alt="paltuu logo" />
                        </div>

                        <div className="text-center md:text-left">
                            <h1 className="text-3xl text-black md:text-4xl font-bold mb-2">
                                My Applications
                            </h1>
                        </div>
                    </div>
                </header>

                {applications.length === 0 ? (
                    <div className="bg-white p-8 rounded-2xl shadow-sm text-center">
                        <svg
                            className="w-16 h-16 mx-auto text-gray-400 mb-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                            No Applications Yet
                        </h2>
                        <p className="text-gray-600 mb-6">
                            You haven't submitted any applications yet.
                        </p>
                        <a
                            href="/browse-pets"
                            className="px-6 py-3 bg-primary text-white rounded-3xl hover:bg-primary-dark transition-all duration-300 inline-block">
                            Browse Pets
                        </a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {applications.map((app) => (
                            <div
                                key={app.application_id}
                                className="bg-white p-4 rounded-2xl shadow-sm overflow-hidden border-2 border-transparent hover:border-primary hover:scale-102 transition-all duration-300 relative">
                                <img
                                    src={
                                        app.image_url || "/dog-placeholder.png"
                                    }
                                    alt={app.pet_name}
                                    className="w-full h-48 object-cover rounded-xl mb-4"
                                />

                                <h3 className="text-xl font-bold text-gray-800 mb-2">
                                    {app.pet_name}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    {app.breed && (
                                        <p className="text-gray-600 flex items-center">
                                            <svg
                                                className="w-4 h-4 mr-2 text-primary"
                                                fill="currentColor"
                                                viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            {app.breed}
                                        </p>
                                    )}

                                    <p className="text-gray-600 flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-2 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                        {`${app.city_name}, ${app.area}`}
                                    </p>

                                    <p className="text-gray-600 flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-2 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        {app.age}{" "}
                                        {app.age === 1 ? "year" : "years"} old
                                    </p>

                                    <p className="text-gray-600 flex items-center">
                                        <svg
                                            className="w-4 h-4 mr-2 text-primary"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24">
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                        Applied on{" "}
                                        {new Date(
                                            app.created_at
                                        ).toLocaleDateString()}
                                    </p>
                                </div>

                                <button
                                    className="w-full bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors"
                                    onClick={() =>
                                        handleDeleteApplication(
                                            app.application_id
                                        )
                                    }>
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
