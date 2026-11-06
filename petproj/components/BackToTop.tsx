"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating pill for long lists. Bottom centre on every screen size, because the
 * bottom-right corner already holds the mobile "Add Pet" button and the AI chat.
 */
export default function BackToTop({ showAfter = 800 }: { showAfter?: number }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const onScroll = () => setVisible(window.scrollY > showAfter);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [showAfter]);

    if (!visible) return null;

    const toTop = () => {
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
    };

    return (
        <button
            type="button"
            onClick={toTop}
            className="fixed bottom-4 left-1/2 z-30 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg transition-opacity hover:opacity-90"
        >
            <ArrowUp size={15} aria-hidden /> Back to top
        </button>
    );
}
