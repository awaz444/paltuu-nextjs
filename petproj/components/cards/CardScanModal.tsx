"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Github, Linkedin } from "lucide-react";
import Modal from "@/components/community/Modal";
import { cardFromSearch, type BusinessCard } from "@/lib/businessCards";

const SEEN_KEY = "card_scan_seen";

/**
 * Greets someone who scanned a founder's business card: the QR lands on
 * ?utm_source=card-<id> (lib/businessCards.ts). Mounted in the root layout so
 * it works on whichever page the link opens. Shown once per tab per card, so
 * a refresh doesn't bring it back.
 */
export default function CardScanModal() {
    const [scan, setScan] = useState<{ id: string; card: BusinessCard } | null>(null);

    useEffect(() => {
        const found = cardFromSearch(window.location.search);
        if (!found) return;
        try {
            if (sessionStorage.getItem(SEEN_KEY) === found.id) return;
            sessionStorage.setItem(SEEN_KEY, found.id);
        } catch {
            // Storage blocked: show it anyway.
        }
        setScan(found);
    }, []);

    if (!scan) return null;
    const { card } = scan;
    const close = () => setScan(null);

    return (
        <Modal open onClose={close} label={`You scanned ${card.firstName}'s card`}>
            <div className="px-6 pb-6 pt-8 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={card.image}
                    alt=""
                    aria-hidden
                    width={112}
                    height={112}
                    className="mx-auto h-28 w-28 rounded-full border-4 border-primary/15 bg-white object-cover"
                />
                <h2 className="mt-4 text-xl font-extrabold text-gray-900">
                    You scanned <span className="text-primary">{card.firstName}&apos;s</span> card
                </h2>
                <p className="text-sm text-gray-500">
                    {card.name} · {card.role}
                </p>

                <blockquote className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-left text-[15px] leading-relaxed text-gray-700">
                    {card.message}
                    <footer className="mt-1.5 text-sm font-semibold text-gray-900">{card.firstName}</footer>
                </blockquote>

                {(card.linkedin || card.github) && (
                    <div className="mt-4 flex justify-center gap-2">
                        {card.linkedin && (
                            <a
                                href={card.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-cta="card_linkedin"
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                            >
                                <Linkedin size={16} aria-hidden /> LinkedIn
                            </a>
                        )}
                        {card.github && (
                            <a
                                href={card.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                data-cta="card_github"
                                className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:border-gray-400"
                            >
                                <Github size={16} aria-hidden /> GitHub
                            </a>
                        )}
                    </div>
                )}

                <div className="mt-6 flex flex-col gap-2">
                    <Link
                        href="/app"
                        data-cta="card_download_app"
                        className="flex h-12 items-center justify-center rounded-full bg-primary text-[15px] font-semibold text-white hover:opacity-90"
                    >
                        Download the app
                    </Link>
                    <button
                        type="button"
                        onClick={close}
                        data-cta="card_continue"
                        className="flex h-12 items-center justify-center rounded-full border border-gray-300 text-[15px] font-semibold text-gray-800 hover:border-primary hover:text-primary"
                    >
                        Continue to website
                    </button>
                </div>
            </div>
        </Modal>
    );
}
