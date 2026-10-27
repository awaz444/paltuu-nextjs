"use client";

import AppStoreBadges from "@/components/home/AppStoreBadges";
import Modal from "./Modal";

/** For actions that only exist in the app (reposting), and for signed-out visitors. */
export default function GetAppModal({
    open,
    onClose,
    title,
    body,
    signInHref,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    body: string;
    /** Set for actions the website can do once you're signed in. */
    signInHref?: string;
}) {
    return (
        <Modal open={open} onClose={onClose} label={title}>
            <div className="px-6 pb-6 pt-12 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/species/dog.jpg" alt="" aria-hidden className="mx-auto mb-3 h-24 w-24 rounded-full object-cover" />
                <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-gray-600">{body}</p>
                {signInHref && (
                    <a href={signInHref} className="mt-5 block rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-white">
                        Log in or sign up
                    </a>
                )}
                <p className={`text-xs text-gray-500 ${signInHref ? "mt-4" : "mt-5"}`}>{signInHref ? "Or get the Paltuu app" : "Get the free Paltuu app"}</p>
                <AppStoreBadges className="mt-2 justify-center" />
            </div>
        </Modal>
    );
}
