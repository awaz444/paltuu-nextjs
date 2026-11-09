"use client";

import Image from "next/image";
import Link from "next/link";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import AppStoreBadges from "@/components/home/AppStoreBadges";
import { APP_LINKS, VETS_AT_HOME } from "@/lib/homeContent";

/**
 * /open?path=<app path> hands a web visitor over to the Paltuu app at that
 * path (paltuu://<path>). Every "Book in the app" link for Vets at Home lands
 * here, as do shared posts, profiles and pets.
 *
 * - Phones try the app straight away. Android uses an intent:// URL, which
 *   opens the app if it's installed and falls back to the Play Store if not;
 *   iOS uses paltuu:// and, if nothing happened after a moment, says so and
 *   offers the App Store.
 * - Desktops can't open the app, so they get a QR code of this same page to
 *   scan with a phone, plus the store badges. Nothing is attempted.
 *
 * Phone first, in the landing pages' look. Vets at Home is set in the app's
 * pixel face, like everywhere else it appears.
 */

type Platform = "ios" | "android" | "desktop";

interface Target {
    vetsAtHome?: boolean;
    title: string;
    body: string;
    /** The same thing on the website, when there is one. */
    web?: { href: string; label: string };
}

function describe(path: string): Target {
    if (path.startsWith("express-vet")) {
        return {
            vetsAtHome: true,
            title: "Vets at Home",
            body: `Certified vets and caretakers, at your doorstep in ${VETS_AT_HOME.city}. Booking happens in the Paltuu app.`,
        };
    }
    if (path.startsWith("post/")) {
        return { title: "Open this post in the Paltuu app", body: "See the photos, the comments and the pet behind them." };
    }
    if (path.startsWith("profile/")) {
        return { title: "Open this profile in the Paltuu app", body: "Follow them and see what their pets are up to." };
    }
    if (path.startsWith("pet-details")) {
        const id = path.match(/(?:petId|id)=(\d+)/)?.[1];
        return {
            title: "Open this pet in the Paltuu app",
            body: "Apply to adopt and talk to the owner from the app.",
            web: id ? { href: `/browse-pets/${id}`, label: "View this pet on the website" } : undefined,
        };
    }
    return { title: "Open the Paltuu app", body: "Adopt a pet, meet other pet parents and find a vet, all in one app." };
}

function detectPlatform(): Platform {
    const ua = navigator.userAgent || "";
    if (/iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
    if (/Android/i.test(ua)) return "android";
    return "desktop";
}

function appUrl(path: string, platform: Platform): string {
    if (platform === "android") {
        const fallback = encodeURIComponent(APP_LINKS.android);
        return `intent://${path}#Intent;scheme=paltuu;package=com.paltuu.app;S.browser_fallback_url=${fallback};end`;
    }
    return `paltuu://${path}`;
}

export default function OpenClient() {
    const [path, setPath] = useState<string | null>(null);
    const [platform, setPlatform] = useState<Platform | null>(null);
    const [status, setStatus] = useState<"idle" | "opening" | "failed">("idle");
    const [qr, setQr] = useState<string | null>(null);

    // Read everything on the client: the page is shared and cached.
    useEffect(() => {
        const raw = new URLSearchParams(window.location.search).get("path") || "";
        let clean = raw;
        try {
            clean = decodeURIComponent(raw);
        } catch {
            /* keep raw */
        }
        setPath(clean.replace(/^\/+/, ""));
        setPlatform(detectPlatform());
    }, []);

    const open = () => {
        if (path === null || !platform || platform === "desktop") return;
        setStatus("opening");
        const started = Date.now();
        window.location.href = appUrl(path, platform);
        // If the app took over, this page is hidden by now. Still here: it didn't open.
        window.setTimeout(() => {
            if (!document.hidden && Date.now() - started < 3500) setStatus("failed");
        }, 2200);
    };

    // Phones: try once on arrival.
    useEffect(() => {
        if (path !== null && (platform === "ios" || platform === "android")) open();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [path, platform]);

    // Desktop: a QR of this very page, which opens the app when scanned on a phone.
    useEffect(() => {
        if (platform !== "desktop") return;
        QRCode.toDataURL(window.location.href, { margin: 1, width: 360, color: { dark: "#111827", light: "#ffffff" } })
            .then(setQr)
            .catch(() => setQr(null));
    }, [platform]);

    const target = describe(path ?? "");
    const storeHref = platform === "ios" ? APP_LINKS.ios : APP_LINKS.android;

    return (
        <section className="bg-white px-5 pb-16 pt-8 md:pt-14">
            <div className="mx-auto flex max-w-md flex-col items-center text-center">
                {/* Brand line, as on the homepage's Vets at Home section */}
                <div className="mb-3 flex w-full items-center gap-4" aria-hidden="true">
                    <span className="h-px flex-1 bg-gray-200" />
                    <Image src="/paltuu%20bilkul%20tight.svg" alt="" width={2210} height={1173} unoptimized className="h-12 w-auto" />
                    <span className="h-px flex-1 bg-gray-200" />
                </div>

                {target.vetsAtHome ? (
                    <h1 className="font-pixel text-2xl leading-normal text-gray-900">{target.title}</h1>
                ) : (
                    <h1 className="text-2xl font-semibold leading-snug text-gray-900">{target.title}</h1>
                )}
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-600">{target.body}</p>

                {target.vetsAtHome && (
                    <>
                        <Image
                            src="/landing/vet-scooter.webp"
                            alt="A Paltuu vet riding a scooter to a pet's home"
                            width={1600}
                            height={893}
                            priority
                            sizes="(min-width: 448px) 448px, 100vw"
                            className="my-4 h-auto w-full"
                        />
                        <ul className="mb-2 flex flex-wrap justify-center gap-2">
                            {["Doorstep Vet", "Grooming", "Neutering and Spaying", "Vaccination"].map((s) => (
                                <li key={s} className="rounded-full bg-[#f5f5f5] px-3 py-1.5 font-pixel text-[10px] leading-relaxed text-gray-900">
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </>
                )}

                <div className="mt-5 w-full rounded-3xl bg-gray-100 p-5">
                    {platform === "desktop" ? (
                        <>
                            <p className="text-[15px] font-semibold text-gray-900">Scan with your phone&apos;s camera</p>
                            <p className="mt-1 text-[13px] text-gray-600">It opens the Paltuu app right where you need it.</p>
                            <div className="mx-auto mt-4 flex h-[188px] w-[188px] items-center justify-center rounded-2xl bg-white p-3 shadow-sm">
                                {qr && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={qr} alt="QR code that opens this page in the Paltuu app" width={164} height={164} />
                                )}
                            </div>
                            <p className="mb-3 mt-5 text-[13px] font-semibold text-gray-700">Don&apos;t have the app yet?</p>
                            <AppStoreBadges className="justify-center" />
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={open}
                                disabled={!platform}
                                className={`flex min-h-14 w-full items-center justify-center rounded-2xl bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-60 ${
                                    target.vetsAtHome ? "font-pixel text-[13px] leading-relaxed" : "text-base font-semibold"
                                }`}
                            >
                                {target.vetsAtHome ? "Book in the app →" : "Open the Paltuu app"}
                            </button>
                            <p className="mt-3 min-h-5 text-[13px] text-gray-600" aria-live="polite">
                                {status === "opening" && "Opening the Paltuu app…"}
                                {status === "failed" && "Didn't open? You may not have the app yet."}
                            </p>
                            {status === "failed" ? (
                                <a
                                    href={storeHref}
                                    className="mt-3 flex min-h-[52px] w-full items-center justify-center rounded-2xl border-[1.5px] border-primary bg-white text-[15px] font-semibold text-primary"
                                >
                                    Get the free app
                                </a>
                            ) : (
                                <>
                                    <p className="mb-3 mt-3 text-[13px] font-semibold text-gray-700">Don&apos;t have the app yet?</p>
                                    <AppStoreBadges className="justify-center" />
                                </>
                            )}
                        </>
                    )}
                </div>

                {target.vetsAtHome && (
                    <p className="mt-4 text-xs text-gray-600">{VETS_AT_HOME.city} only for now.</p>
                )}

                <div className="mt-5 flex flex-col items-center gap-2 text-sm font-semibold">
                    {target.web && (
                        <Link href={target.web.href} className="text-primary hover:underline">
                            {target.web.label} →
                        </Link>
                    )}
                    <Link href="/" className="text-gray-600 hover:text-primary">
                        Back to Paltuu
                    </Link>
                </div>
            </div>
        </section>
    );
}
