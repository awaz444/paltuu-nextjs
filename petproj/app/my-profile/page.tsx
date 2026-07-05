"use client";

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { format } from "date-fns";
import { AtSign, Camera, Check, ChevronRight, Edit2, Eye, EyeOff, Lock, Mail, Shield, User, X } from "lucide-react";
import Link from "next/link";
import "./styles.css";

interface UserProfileData {
    user_id: string;
    name: string;
    email: string;
    profile_image_url: string;
    created_at: string;
    social_username?: string;
}

interface ListingSnippet {
    pet_id: number;
    pet_name: string;
    image_url: string | null;
    primary_image?: string | null;
    approved: boolean | null;
    listing_type: string;
}

interface ApplicationSnippet {
    application_id: string;
    application_type: string;
    pet_name: string;
    image_url: string;
    status: string;
    created_at: string;
}

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

const MyProfile = () => {
    const { user, isAuthenticated, refreshUser } = useAuth();
    const [data, setData] = useState<UserProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [updatedData, setUpdatedData] = useState<UserProfileData | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    // Username state
    const [usernameInput, setUsernameInput] = useState("");
    const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>("idle");
    const [usernameError, setUsernameError] = useState("");
    const usernameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Listings + applications on profile
    const [listings, setListings] = useState<ListingSnippet[]>([]);
    const [applications, setApplications] = useState<ApplicationSnippet[]>([]);

    // Password modal
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [pwValues, setPwValues] = useState({ current: "", newPw: "", confirm: "" });
    const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
    const [showPw, setShowPw] = useState({ current: false, newPw: false, confirm: false });
    const [pwLoading, setPwLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    const showToast = (type: "success" | "error", text: string) => {
        setToast({ type, text });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchedRef = useRef(false);

    useEffect(() => {
        const loadUserData = async () => {
            if (!isAuthenticated || !user?.id || fetchedRef.current) {
                if (!isAuthenticated || !user?.id) setLoading(false);
                return;
            }

            try {
                fetchedRef.current = true;

                const [profileRes, listingsRes, appsRes] = await Promise.all([
                    fetch("/api/v1/profile"),
                    fetch("/api/v1/profile/listings", { credentials: "include" }),
                    fetch("/api/v1/applications/my", { credentials: "include" }),
                ]);

                if (!profileRes.ok) throw new Error("Failed to fetch profile");
                const profileData = await profileRes.json();
                const finalProfileData = {
                    ...profileData,
                    name: (profileData.name && profileData.name.trim()) || user.name || "User",
                    profile_image_url: (profileData.profile_image_url && profileData.profile_image_url.trim()) || user.profile_image_url || "/no-profile/no-profile.jpg",
                };
                setData(finalProfileData);
                setUpdatedData(finalProfileData);

                if (listingsRes.ok) {
                    const ld = await listingsRes.json();
                    setListings((ld.listings || []).slice(0, 3));
                }
                if (appsRes.ok) {
                    const ad = await appsRes.json();
                    setApplications((ad.applications || []).slice(0, 3));
                }
            } catch {
                const fallback = {
                    user_id: user.id,
                    name: user.name || "User",
                    email: user.email || "",
                    profile_image_url: user.profile_image_url || "/no-profile/no-profile.jpg",
                    created_at: new Date().toISOString(),
                };
                setData(fallback);
                setUpdatedData(fallback);
            } finally {
                setLoading(false);
            }
        };
        loadUserData();
    }, [isAuthenticated, user]);

    // Debounced username availability check
    useEffect(() => {
        if (!editing) return;

        const savedUsername = data?.social_username || "";
        const trimmed = usernameInput.trim();

        // If unchanged from saved value, no need to check
        if (trimmed === savedUsername) {
            setUsernameStatus("idle");
            setUsernameError("");
            return;
        }

        // Empty — clear status
        if (!trimmed) {
            setUsernameStatus("idle");
            setUsernameError("");
            return;
        }

        setUsernameStatus("checking");

        if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);

        usernameDebounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/social/username/check?q=${encodeURIComponent(trimmed)}`);
                const json = await res.json();
                if (!json.valid) {
                    setUsernameStatus("invalid");
                    setUsernameError(json.error || "Invalid username format");
                } else if (json.available) {
                    setUsernameStatus("available");
                    setUsernameError("");
                } else {
                    setUsernameStatus("taken");
                    setUsernameError("Username is already taken");
                }
            } catch {
                setUsernameStatus("idle");
                setUsernameError("");
            }
        }, 400);

        return () => {
            if (usernameDebounceRef.current) clearTimeout(usernameDebounceRef.current);
        };
    }, [usernameInput, editing, data?.social_username]);

    const handleEditStart = () => {
        setUsernameInput(data?.social_username || "");
        setUsernameStatus("idle");
        setUsernameError("");
        setEditing(true);
    };

    const handleImageUpload = async (file: File) => {
        if (!user?.id) return;
        setImageLoading(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const uploadRes = await fetch("/api/v1/profile/avatar", { method: "POST", body: formData });
            if (!uploadRes.ok) throw new Error("Upload failed");
            const { url } = await uploadRes.json();
            setUpdatedData((prev) => prev ? { ...prev, profile_image_url: url } : null);
            setData((prev) => (prev ? { ...prev, profile_image_url: url } : null));
            await refreshUser();
        } catch {
            showToast("error", "Could not update profile image");
        } finally {
            setImageLoading(false);
        }
    };

    const handleSaveChanges = async () => {
        if (!user?.id || !updatedData) return;

        const savedUsername = data?.social_username || "";
        const trimmedUsername = usernameInput.trim();
        const usernameChanged = trimmedUsername !== savedUsername;

        // Block save if username check is in progress or failed
        if (usernameChanged && trimmedUsername) {
            if (usernameStatus === "checking") {
                showToast("error", "Please wait for username check to finish");
                return;
            }
            if (usernameStatus === "taken" || usernameStatus === "invalid") {
                showToast("error", usernameError || "Fix the username before saving");
                return;
            }
        }

        try {
            const profilePromise = fetch("/api/v1/profile", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: updatedData.name }),
            });

            // Only call social update if something related to it changed
            const socialPromise = (usernameChanged || updatedData.name !== data?.name)
                ? fetch("/api/v1/social/profile/update", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: updatedData.name,
                        ...(usernameChanged && { social_username: trimmedUsername }),
                    }),
                  })
                : null;

            const [profileRes, socialRes] = await Promise.all([profilePromise, socialPromise]);

            if (!profileRes.ok) throw new Error("Update failed");

            if (socialRes && !socialRes.ok) {
                const err = await socialRes.json();
                if (socialRes.status === 409) {
                    setUsernameStatus("taken");
                    setUsernameError("Username is already taken");
                    showToast("error", "That username is already taken");
                    return;
                }
                throw new Error(err.message || "Username update failed");
            }

            const result = await profileRes.json();
            const socialResult = socialRes ? await socialRes.json().catch(() => null) : null;

            const newData: UserProfileData = {
                ...result.user,
                social_username: socialResult?.user?.social_username ?? (usernameChanged ? trimmedUsername : data?.social_username),
            };

            setData(newData);
            setUpdatedData(newData);
            setUsernameInput(newData.social_username || "");
            setUsernameStatus("idle");
            setEditing(false);
            await refreshUser();
            showToast("success", "Profile updated successfully");
        } catch {
            showToast("error", "Failed to update profile");
        }
    };

    const handleCancel = () => {
        setUpdatedData(data);
        setUsernameInput(data?.social_username || "");
        setUsernameStatus("idle");
        setUsernameError("");
        setEditing(false);
    };

    const validatePassword = () => {
        const errors: Record<string, string> = {};
        if (!pwValues.current) errors.current = "Required";
        if (!pwValues.newPw) errors.newPw = "Required";
        else if (!passwordRegex.test(pwValues.newPw)) errors.newPw = "Min 8 chars with uppercase, lowercase, number & special character";
        if (!pwValues.confirm) errors.confirm = "Required";
        else if (pwValues.newPw !== pwValues.confirm) errors.confirm = "Passwords don't match";
        return errors;
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validatePassword();
        if (Object.keys(errors).length > 0) { setPwErrors(errors); return; }
        setPwLoading(true);
        try {
            const res = await fetch("/api/v1/profile/password", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword: pwValues.current, newPassword: pwValues.newPw }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Password change failed");
            }
            showToast("success", "Password changed successfully");
            setPasswordModalOpen(false);
            setPwValues({ current: "", newPw: "", confirm: "" });
            setPwErrors({});
        } catch (error: any) {
            showToast("error", error.message || "Failed to change password");
        } finally {
            setPwLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-[3px] border-[#a03048] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-gray-400 uppercase tracking-widest font-medium">Loading Profile</p>
            </div>
        );
    }

    if (!isAuthenticated || !user || !data || !updatedData) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white rounded-3xl p-10 shadow-sm text-center max-w-sm w-full mx-4">
                    <h1 className="text-xl font-bold text-gray-900 mb-2">Sign in required</h1>
                    <p className="text-gray-500 text-sm mb-6">Please log in to manage your profile.</p>
                    <button onClick={() => (window.location.href = "/auth")} className="bg-primary text-white px-8 py-3 rounded-2xl font-medium w-full">Sign In</button>
                </div>
            </div>
        );
    }

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-50 text-yellow-700",
        approved: "bg-green-50 text-green-700",
        rejected: "bg-red-50 text-red-700",
    };

    const UsernameStatusBadge = () => {
        if (usernameStatus === "checking") {
            return (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                    <span className="w-3 h-3 border-[2px] border-gray-400 border-t-transparent rounded-full animate-spin inline-block" />
                    Checking…
                </span>
            );
        }
        if (usernameStatus === "available") {
            return <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><Check size={12} /> Available</span>;
        }
        if (usernameStatus === "taken" || usernameStatus === "invalid") {
            return <span className="flex items-center gap-1 text-xs text-red-500"><X size={12} /> {usernameError}</span>;
        }
        return null;
    };

    return (
        <main className="min-h-screen bg-gray-100 pb-16">
            {/* Slim banner */}
            <div className="bg-white border-b border-gray-100">
                <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-6 px-4 md:px-8 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                        <p className="text-gray-500 text-sm mt-0.5">
                            Hi, <span className="font-medium text-gray-700">{data.name}</span>
                            {data.social_username && (
                                <span className="ml-2 text-primary font-medium">@{data.social_username}</span>
                            )}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {editing ? (
                            <>
                                <button onClick={handleCancel} className="flex items-center gap-1.5 px-4 py-2.5 border-2 border-gray-200 text-gray-600 rounded-2xl text-sm font-medium hover:border-gray-300 transition-colors">
                                    <X size={14} /> Cancel
                                </button>
                                <button onClick={handleSaveChanges} className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity">
                                    <Check size={14} /> Save
                                </button>
                            </>
                        ) : (
                            <button onClick={handleEditStart} className="flex items-center gap-1.5 px-5 py-2.5 bg-primary text-white rounded-2xl text-sm font-medium hover:opacity-90 transition-opacity">
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: "90%", margin: "0 auto" }} className="py-8 px-4 md:px-8 space-y-6">

                {/* Profile card */}
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                    <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                        {/* Avatar */}
                        <div className="relative flex-shrink-0 group">
                            <img
                                src={data.profile_image_url || "/no-profile/no-profile.jpg"}
                                alt={data.name}
                                className="w-28 h-28 rounded-2xl object-cover border-2 border-gray-100"
                            />
                            {editing && (
                                <label
                                    htmlFor="profileImage"
                                    className="absolute inset-0 rounded-2xl bg-black/50 flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <input
                                        type="file"
                                        id="profileImage"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                                    />
                                    {imageLoading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Camera size={20} className="text-white mb-1" />
                                            <span className="text-white text-[10px] font-medium uppercase tracking-wider">Change</span>
                                        </>
                                    )}
                                </label>
                            )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 w-full space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <User size={13} className="inline mr-1.5 text-primary" />Full Name
                                </label>
                                {editing ? (
                                    <input
                                        type="text"
                                        value={updatedData.name}
                                        onChange={(e) => setUpdatedData((prev) => prev ? { ...prev, name: e.target.value } : null)}
                                        className="p-3 w-full border rounded-2xl focus:outline-none focus:border-primary transition-colors"
                                    />
                                ) : (
                                    <p className="text-gray-900 font-medium py-1">{data.name}</p>
                                )}
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <AtSign size={13} className="inline mr-1.5 text-primary" />Username
                                </label>
                                {editing ? (
                                    <div>
                                        <div className="flex items-center border rounded-2xl focus-within:border-primary transition-colors overflow-hidden">
                                            <span className="pl-3 pr-1 text-gray-400 font-medium select-none text-sm">@</span>
                                            <input
                                                type="text"
                                                value={usernameInput}
                                                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ""))}
                                                placeholder="yourhandle"
                                                className="flex-1 py-3 pr-3 focus:outline-none text-gray-900 text-sm bg-transparent"
                                            />
                                        </div>
                                        <div className="mt-1.5 min-h-[18px]">
                                            <UsernameStatusBadge />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-gray-900 font-medium py-1">
                                        {data.social_username ? (
                                            <span className="text-primary">@{data.social_username}</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">No username set</span>
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Email (read-only) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <Mail size={13} className="inline mr-1.5 text-primary" />Email
                                </label>
                                <p className="text-gray-900 font-medium py-1">{data.email}</p>
                            </div>

                            {/* Member since + verified */}
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Member Since</p>
                                    <p className="text-sm font-semibold text-gray-800 mt-0.5">
                                        {data.created_at && !isNaN(new Date(data.created_at).getTime())
                                            ? format(new Date(data.created_at), "MMM yyyy")
                                            : "N/A"}
                                    </p>
                                </div>
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full">
                                    <Shield size={12} className="text-primary" />
                                    <span className="text-xs font-medium text-primary">Verified Member</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Security card */}
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center gap-2 mb-5">
                        <Lock size={16} className="text-primary" />
                        <h2 className="text-base font-semibold text-gray-900">Password & Security</h2>
                    </div>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <p className="text-sm text-gray-500">Protect your account with a strong, unique password.</p>
                        <button
                            onClick={() => setPasswordModalOpen(true)}
                            className="flex items-center gap-2 px-5 py-2.5 border-2 border-primary text-primary rounded-2xl text-sm font-medium hover:bg-primary hover:text-white transition-colors whitespace-nowrap"
                        >
                            <Lock size={13} /> Change Password
                        </button>
                    </div>
                </div>

                {/* My Listings preview */}
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-gray-900">My Listings</h2>
                        <Link href="/my-listings" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>
                    {listings.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
                            <p className="text-gray-400 text-sm mb-3">No listings yet</p>
                            <Link href="/create-listing" className="text-primary text-sm font-medium hover:underline">Create a listing →</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {listings.map((pet) => (
                                <div key={pet.pet_id} className="rounded-2xl overflow-hidden border border-gray-100 hover:border-primary transition-colors">
                                    <img
                                        src={pet.primary_image || pet.image_url || "/dog-placeholder.png"}
                                        alt={pet.pet_name}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="p-3 flex items-center justify-between gap-2">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{pet.pet_name}</p>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${pet.approved ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
                                            {pet.approved ? "Approved" : "Pending"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* My Applications preview */}
                <div className="bg-white rounded-3xl shadow-sm p-6 md:p-8">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-base font-semibold text-gray-900">My Applications</h2>
                        <Link href="/my-applications" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline">
                            View All <ChevronRight size={14} />
                        </Link>
                    </div>
                    {applications.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-gray-200 rounded-2xl">
                            <p className="text-gray-400 text-sm mb-3">No applications yet</p>
                            <Link href="/browse-pets" className="text-primary text-sm font-medium hover:underline">Browse pets →</Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {applications.map((app) => (
                                <div key={app.application_id} className="rounded-2xl overflow-hidden border border-gray-100 hover:border-primary transition-colors">
                                    <img
                                        src={app.image_url || "/dog-placeholder.png"}
                                        alt={app.pet_name}
                                        className="w-full h-32 object-cover"
                                    />
                                    <div className="p-3">
                                        <div className="flex items-center justify-between gap-2 mb-1">
                                            <p className="font-semibold text-gray-800 text-sm truncate">{app.pet_name}</p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${statusColors[app.status?.toLowerCase()] || "bg-gray-100 text-gray-600"}`}>
                                                {app.status || "Pending"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 capitalize">{app.application_type}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Password modal */}
            {passwordModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-lg w-full max-w-md">
                        {/* Modal header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
                                    <Lock size={18} className="text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900">Change Password</h2>
                                    <p className="text-xs text-gray-400">Update your account security</p>
                                </div>
                            </div>
                            <button
                                onClick={() => { setPasswordModalOpen(false); setPwErrors({}); setPwValues({ current: "", newPw: "", confirm: "" }); }}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                            >
                                <X size={16} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal form */}
                        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-4">
                            {/* Current password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw.current ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={pwValues.current}
                                        onChange={(e) => { setPwValues((p) => ({ ...p, current: e.target.value })); setPwErrors((p) => ({ ...p, current: "" })); }}
                                        className={`p-3 w-full border rounded-2xl pr-10 focus:outline-none focus:border-primary transition-colors ${pwErrors.current ? "border-red-400" : ""}`}
                                    />
                                    <button type="button" onClick={() => setShowPw((p) => ({ ...p, current: !p.current }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPw.current ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {pwErrors.current && <p className="text-xs text-red-500 mt-1">{pwErrors.current}</p>}
                            </div>

                            {/* New password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw.newPw ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={pwValues.newPw}
                                        onChange={(e) => { setPwValues((p) => ({ ...p, newPw: e.target.value })); setPwErrors((p) => ({ ...p, newPw: "" })); }}
                                        className={`p-3 w-full border rounded-2xl pr-10 focus:outline-none focus:border-primary transition-colors ${pwErrors.newPw ? "border-red-400" : ""}`}
                                    />
                                    <button type="button" onClick={() => setShowPw((p) => ({ ...p, newPw: !p.newPw }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPw.newPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {pwErrors.newPw && <p className="text-xs text-red-500 mt-1">{pwErrors.newPw}</p>}
                            </div>

                            {/* Confirm password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPw.confirm ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={pwValues.confirm}
                                        onChange={(e) => { setPwValues((p) => ({ ...p, confirm: e.target.value })); setPwErrors((p) => ({ ...p, confirm: "" })); }}
                                        className={`p-3 w-full border rounded-2xl pr-10 focus:outline-none focus:border-primary transition-colors ${pwErrors.confirm ? "border-red-400" : ""}`}
                                    />
                                    <button type="button" onClick={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPw.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {pwErrors.confirm && <p className="text-xs text-red-500 mt-1">{pwErrors.confirm}</p>}
                            </div>

                            <button
                                type="submit"
                                disabled={pwLoading}
                                className="w-full p-3 bg-primary text-white rounded-2xl font-medium disabled:opacity-60 mt-2"
                            >
                                {pwLoading ? "Updating..." : "Update Password"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium text-white ${toast.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
                    {toast.text}
                </div>
            )}
        </main>
    );
};

export default MyProfile;
