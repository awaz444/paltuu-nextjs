"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const CONSENT_KEY = "paltuu_cookie_consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      setVisible(true);
    }
    setMounted(true);
  }, []);

  const handleChoice = (choice: "accepted" | "rejected") => {
    localStorage.setItem(CONSENT_KEY, choice);
    setVisible(false);
  };

  if (!mounted) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[9997] transition-transform duration-500 ease-in-out ${
        visible ? "translate-y-0" : "translate-y-full pointer-events-none"
      }`}
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
    >
      <div className="mx-auto max-w-5xl p-4 sm:p-6">
        <div className="relative flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <button
            onClick={() => handleChoice("rejected")}
            aria-label="Dismiss"
            className="absolute right-3 top-3 text-gray-400 transition-colors hover:text-gray-600 sm:hidden"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-3 sm:items-center">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--light-color)" }}
            >
              <Cookie size={20} style={{ color: "var(--primary-color)" }} />
            </div>
            <p className="text-sm text-gray-600 sm:text-base">
              We use cookies to keep you signed in, remember your preferences, and understand how
              Paltuu is used. Read our{" "}
              <Link href="/privacy-policy" className="font-medium underline underline-offset-2" style={{ color: "var(--primary-color)" }}>
                Privacy Policy
              </Link>{" "}
              to learn more.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 sm:ml-auto">
            <button
              onClick={() => handleChoice("rejected")}
              className="flex-1 rounded-full border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 sm:flex-none"
            >
              Reject
            </button>
            <button
              onClick={() => handleChoice("accepted")}
              className="flex-1 rounded-full px-5 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:flex-none"
              style={{ backgroundColor: "var(--primary-color)" }}
            >
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
