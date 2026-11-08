"use client";

import { useCallback, useEffect, useRef } from "react";
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
 * them back to this page afterwards with ?reveal=1, so the page can show the
 * contact straight away (useRevealOnReturn).
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
                router.push(authUrl(withReveal(currentPath())));
                return;
            }
            action?.();
        },
        [isHydrating, signedIn, router]
    );

    return { signedIn, requireSignIn };
}

const REVEAL_PARAM = "reveal";

function withReveal(path: string): string {
    const url = new URL(path, "https://paltuu.local");
    url.searchParams.set(REVEAL_PARAM, "1");
    return url.pathname + url.search;
}

/**
 * Runs `reveal` once when someone comes back signed in from the contact gate,
 * then drops ?reveal=1 from the address bar so a refresh doesn't repeat it.
 */
export function useRevealOnReturn(reveal: () => void) {
    const { signedIn } = useContactGate();
    const done = useRef(false);
    useEffect(() => {
        if (done.current || !signedIn) return;
        const url = new URL(window.location.href);
        if (url.searchParams.get(REVEAL_PARAM) !== "1") return;
        done.current = true;
        url.searchParams.delete(REVEAL_PARAM);
        window.history.replaceState(null, "", url.pathname + url.search + url.hash);
        reveal();
    }, [signedIn, reveal]);
}

/** "+92 300 1234567" -> "+92 300 •••••••": enough to recognise, not to dial. */
export function maskPhone(phone: string | null | undefined): string {
    const pretty = formatPhoneDisplay(phone).pretty;
    const total = pretty.replace(/\D/g, "").length;
    let keep = Math.max(0, total - 7);
    return pretty.replace(/\d/g, (d) => (keep-- > 0 ? d : "•"));
}
