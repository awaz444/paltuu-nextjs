"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { formatAge } from "@/utils/formatAge";
import { useAuth } from "@/context/AuthContext";

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
    age_months: number;
    adoption_status: string;
    image_url: string;
}

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [confirmModal, setConfirmModal] = useState<{ applicationId: string; applicationType: string } | null>(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const { user, isAuthenticated, isHydrating } = useAuth();
    const lastFetchedUserId = useRef<string | null>(null);
    const isFetching = useRef(false);

    const showToast = (type: "success" | "error", text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchApplications = useCallback(async () => {
        if (!isAuthenticated || !user) {
            if (!isHydrating) { setError("You must be logged in to view your applications."); setLoading(false); }
            return;
        }
        if (isFetching.current || lastFetchedUserId.current === user.id) return;

        try {
            isFetching.current = true;
            setLoading(true);
            setError(null);
            const res = await fetch("/api/v1/applications/my", { method: "GET", credentials: "include", headers: { "Content-Type": "application/json" } });
            if (!res.ok) {
                const errorData = await res.json();
                setError(res.status === 401 ? "Authentication failed. Please log in again." : errorData.error || "Failed to fetch applications");
                return;
            }
            const data = await res.json();
            setApplications(data.applications || []);
            lastFetchedUserId.current = user.id || null;
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
            isFetching.current = false;
        }
    }, [isAuthenticated, user, isHydrating]);

    useEffect(() => {
        if (!isHydrating) fetchApplications();
    }, [isAuthenticated, user, isHydrating, fetchApplications]);

    const handleDeleteApplication = async () => {
        if (!confirmModal) return;
        const { applicationId, applicationType } = confirmModal;
        setDeleteLoading(true);
        try {
            const res = await fetch(`/api/v1/applications/my?application_id=${applicationId}&type=${applicationType}`, {
                method: "DELETE", credentials: "include", headers: { "Content-Type": "application/json" },
            });
            if (!res.ok) {
                const { error: errMsg } = await res.json();
                showToast("error", errMsg || "Failed to delete application");
                return;
            }
            setApplications((prev) => prev.filter((app) => app.application_id !== applicationId));
            showToast("success", "Application deleted successfully.");
        } catch {
            showToast("error", "An unexpected error occurred while deleting.");
        } finally {
            setDeleteLoading(false);
            setConfirmModal(null);
        }
    };

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-50 text-yellow-700",
        approved: "bg-green-50 text-green-700",
        rejected: "bg-red-50 text-red-700",
    };

    if (isHydrating || loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="w-8 h-8 border-[3px] border-[#a03048] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!isAuthenticated || !user) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <p className="text-gray-500 text-sm mb-5">You must be logged in to view your applications.</p>
                    <a href="/auth" className="bg-primary text-white px-6 py-3 rounded-2xl font-medium inline-block">Sign In</a>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <p className="text-red-500 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-100">
            {/* Slim banner */}
            <div className="bg-white border-b border-gray-100">
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
                    {user.name && <p className="text-gray-500 text-sm mt-0.5">Hi, <span className="font-medium text-gray-700">{user.name}</span></p>}
                </div>
            </div>

            <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8">
                {applications.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 shadow-sm text-center max-w-lg mx-auto">
                        <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">No Applications Yet</h2>
                        <p className="text-gray-500 text-sm mb-6">You haven't submitted any applications yet.</p>
                        <a href="/browse-pets" className="bg-primary text-white px-6 py-3 rounded-2xl font-medium inline-block">Browse Pets</a>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {applications.map((app) => (
                            <div
                                key={app.application_id}
                                className="bg-white rounded-3xl shadow-sm overflow-hidden border-2 border-transparent hover:border-[#a03048] hover:scale-[1.02] transition-all duration-300"
                            >
                                <div className="relative">
                                    <img
                                        src={app.image_url || "/dog-placeholder.png"}
                                        alt={app.pet_name}
                                        className="w-full aspect-square object-cover"
                                    />
                                    {/* Application type badge */}
                                    <span className="absolute top-2 left-2 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full capitalize">
                                        {app.application_type}
                                    </span>
                                    {/* Status badge */}
                                    <span className={`absolute top-2 right-2 text-xs font-semibold px-3 py-1 rounded-full capitalize ${statusColors[app.status?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                                        {app.status || "Pending"}
                                    </span>
                                </div>

                                <div className="p-4">
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{app.pet_name}</h3>

                                    <div className="space-y-1.5 mb-4 text-sm text-gray-500">
                                        {app.breed && (
                                            <p className="flex items-center gap-2">
                                                <svg className="w-4 h-4 text-primary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                </svg>
                                                {app.breed}
                                            </p>
                                        )}
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            {app.city_name}, {app.area}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            {formatAge(app.age_months)}
                                        </p>
                                        <p className="flex items-center gap-2">
                                            <svg className="w-4 h-4 text-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            Applied {new Date(app.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setConfirmModal({ applicationId: app.application_id, applicationType: app.application_type })}
                                        className="w-full border-2 border-primary text-primary py-2.5 px-4 rounded-2xl text-sm font-medium hover:bg-primary hover:text-white transition-colors duration-200"
                                    >
                                        Withdraw Application
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Custom delete confirm modal */}
            {confirmModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-lg w-full max-w-sm p-8">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Withdraw Application?</h3>
                        <p className="text-gray-500 text-sm mb-6">This action cannot be undone. Your application will be permanently removed.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal(null)}
                                className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-2xl font-medium hover:border-gray-300 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteApplication}
                                disabled={deleteLoading}
                                className="flex-1 py-3 bg-red-500 text-white rounded-2xl font-medium hover:bg-red-600 transition-colors disabled:opacity-60"
                            >
                                {deleteLoading ? "Removing..." : "Yes, Withdraw"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white transition-all ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
                    {toast.text}
                </div>
            )}
        </main>
    );
}
