"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Centered dialog on desktop, full screen on phones (like x.com's compose).
 * Closes on Escape and on a backdrop click; locks page scroll while open.
 * z-[9998] keeps it above the cookie banner (z-[9997]).
 */
export default function Modal({
    open,
    onClose,
    label,
    children,
    fullScreenOnMobile = false,
}: {
    open: boolean;
    onClose: () => void;
    label: string;
    children: React.ReactNode;
    fullScreenOnMobile?: boolean;
}) {
    const panel = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        document.addEventListener("keydown", onKey);
        panel.current?.focus();
        return () => {
            document.body.style.overflow = overflow;
            document.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return createPortal(
        <div
            className={`fixed inset-0 z-[9998] flex justify-center bg-black/40 ${fullScreenOnMobile ? "items-stretch sm:items-start sm:pt-[8vh]" : "items-center p-4"}`}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-label={label}
                tabIndex={-1}
                className={`relative w-full bg-white outline-none ${
                    fullScreenOnMobile ? "flex flex-col sm:h-auto sm:max-w-xl sm:rounded-2xl" : "max-w-sm rounded-2xl"
                } shadow-xl`}
            >
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute left-3 top-3 z-10 rounded-full p-1.5 text-gray-700 hover:bg-gray-100"
                >
                    <X size={20} />
                </button>
                {children}
            </div>
        </div>,
        document.body
    );
}
