"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { message } from "antd";
import { useAuth } from "@/context/AuthContext";
import { authUrl, currentPath } from "@/lib/authRedirect";
import { formatPhoneDisplay } from "@/utils/phone";

/**
 * Calling or messaging a vet, a clinic or a pet's owner needs an account.
 *
 * Signed-out visitors see a masked number, and any contact action (call,
 * WhatsApp, copy, opening the contact modal) sends them to /auth, which brings
 * them back to this page afterwards.
 */
export function useContactGate() {
    const { isAuthenticated, user, isHydrating } = useAuth();
    const router = useRouter();
    const signedIn = isAuthenticated && !!user?.id;

    /** Runs `action` when signed in, otherwise sends the visitor to sign in. */
    const requireSignIn = useCallback(
        (action?: () => void) => {
            // Login status is still loading; don't send a signed-in user to /auth.
            if (isHydrating) return;
            if (!signedIn) {
                message.info("Please sign in to see contact details");
                router.push(authUrl(currentPath()));
                return;
            }
            action?.();
        },
        [isHydrating, signedIn, router]
    );

    return { signedIn, requireSignIn };
}

/** "+92 300 1234567" -> "+92 300 •••••••": enough to recognise, not to dial. */
export function maskPhone(phone: string | null | undefined): string {
    const pretty = formatPhoneDisplay(phone).pretty;
    const total = pretty.replace(/\D/g, "").length;
    let keep = Math.max(0, total - 7);
    return pretty.replace(/\d/g, (d) => (keep-- > 0 ? d : "•"));
}
