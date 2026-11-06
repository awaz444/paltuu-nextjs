"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/** /my-profile and /profile open your own page at /profile/<id>, so there is one profile page for everyone. */
export default function MyProfileRedirect() {
    const router = useRouter();
    const { user, isAuthenticated, isHydrating } = useAuth();
    const id = user?.id ?? user?.user_id;

    useEffect(() => {
        if (isAuthenticated && id) router.replace(`/profile/${id}`);
    }, [isAuthenticated, id, router]);

    if (isHydrating || (isAuthenticated && id)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4 text-center">
            <h1 className="mb-2 text-xl font-bold text-gray-900">Sign in required</h1>
            <p className="mb-4 text-sm text-gray-600">Log in to see your profile.</p>
            <Link href="/auth" className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white">
                Log in
            </Link>
        </div>
    );
}
