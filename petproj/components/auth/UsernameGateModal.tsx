"use client";

import { useEffect, useRef, useState } from "react";
import { Modal } from "antd";
import { toast } from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

type UsernameStatus = "idle" | "checking" | "available" | "taken" | "invalid";

export default function UsernameGateModal() {
    const { needsUsername, updateSocialUsername } = useAuth();
    const [value, setValue] = useState("");
    const [status, setStatus] = useState<UsernameStatus>("idle");
    const [error, setError] = useState("");
    const [agreed, setAgreed] = useState(false);
    const [saving, setSaving] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Reset local form state whenever the gate closes (username was set) so a
    // future prompt for a different account starts clean.
    useEffect(() => {
        if (!needsUsername) {
            setValue("");
            setStatus("idle");
            setError("");
            setAgreed(false);
        }
    }, [needsUsername]);

    useEffect(() => {
        const trimmed = value.trim();

        if (!trimmed) {
            setStatus("idle");
            setError("");
            return;
        }

        setStatus("checking");

        if (debounceRef.current) clearTimeout(debounceRef.current);

        debounceRef.current = setTimeout(async () => {
            try {
                const res = await fetch(`/api/v1/social/username/check?q=${encodeURIComponent(trimmed)}`);
                const json = await res.json();
                if (!json.valid) {
                    setStatus("invalid");
                    setError(json.error || "Invalid username format");
                } else if (json.available) {
                    setStatus("available");
                    setError("");
                } else {
                    setStatus("taken");
                    setError("This username is already taken");
                }
            } catch {
                setStatus("idle");
                setError("");
            }
        }, 400);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [value]);

    const canSubmit = status === "available" && agreed && !saving;

    const handleSubmit = async () => {
        if (!canSubmit) return;
        setSaving(true);
        try {
            const res = await fetch("/api/v1/social/profile/update", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ social_username: value.trim() }),
            });
            const json = await res.json();

            if (!res.ok) {
                setError(json.error || "Failed to save your username.");
                if (res.status === 409) setStatus("taken");
                return;
            }

            updateSocialUsername(json.user?.social_username || value.trim().toLowerCase());
            toast.success("Username set!");
        } catch {
            setError("Failed to save your username. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal
            title="Pick your username"
            open={needsUsername}
            closable={false}
            maskClosable={false}
            keyboard={false}
            footer={null}
            centered
            className="[&_.ant-modal-content]:p-6"
        >
            <div className="space-y-4">
                <p className="text-gray-600 text-sm">
                    This is your public handle on Paltuu &mdash; it&apos;s how people find your
                    profile, mention you, and see your posts in the community feed.
                </p>

                <div>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">@</span>
                        <input
                            type="text"
                            value={value}
                            onChange={(e) => setValue(e.target.value.toLowerCase())}
                            autoCapitalize="none"
                            autoCorrect="off"
                            placeholder="username"
                            className="w-full border border-gray-300 rounded-xl pl-8 pr-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                    </div>
                    <div className="mt-1 text-sm min-h-[1.25rem]">
                        {status === "checking" && <span className="text-gray-400">Checking availability&hellip;</span>}
                        {status === "available" && <span className="text-green-600">@{value.trim()} is available</span>}
                        {(status === "taken" || status === "invalid") && (
                            <span className="text-red-500">{error}</span>
                        )}
                    </div>
                </div>

                <label className="flex items-start gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        checked={agreed}
                        onChange={(e) => setAgreed(e.target.checked)}
                        className="mt-0.5"
                    />
                    <span>
                        I agree to the{" "}
                        <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Terms &amp; Conditions
                        </a>
                    </span>
                </label>

                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className={`w-full bg-primary text-white py-2 px-4 rounded-xl transition ${
                        !canSubmit ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                >
                    {saving ? "Saving..." : "Continue"}
                </button>
            </div>
        </Modal>
    );
}
