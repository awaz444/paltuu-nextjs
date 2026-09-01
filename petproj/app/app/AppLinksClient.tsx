"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const IOS_URL = "https://apps.apple.com/pk/app/paltuu/id6789732258";
const ANDROID_URL =
  "https://play.google.com/store/apps/details?id=com.paltuu.app";

type Platform = "ios" | "android" | "other";

const BADGES = [
  {
    key: "ios" as const,
    href: IOS_URL,
    src: "/app-download-badges/app-store-badge.svg",
    alt: "Download on the App Store",
    label: "Download Paltuu on the App Store",
    // The two store SVGs have different aspect ratios; size by height, width auto.
    width: 144,
  },
  {
    key: "android" as const,
    href: ANDROID_URL,
    src: "/app-download-badges/google-play-badge.svg",
    alt: "Get it on Google Play",
    label: "Get Paltuu on Google Play",
    width: 162,
  },
];

export default function AppLinksClient() {
  const [platform, setPlatform] = useState<Platform>("other");

  useEffect(() => {
    const ua =
      navigator.userAgent || navigator.vendor || (window as any).opera || "";
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      // iPadOS 13+ reports as a Mac — disambiguate with touch support.
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (isIOS) setPlatform("ios");
    else if (/android/i.test(ua)) setPlatform("android");
  }, []);

  // Lead with the badge for the visitor's device.
  const ordered = [...BADGES].sort((a, b) =>
    a.key === platform ? -1 : b.key === platform ? 1 : 0
  );

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-white px-6 py-16 text-gray-900">
      <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-[#a03048]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 rounded-full bg-[#a03048]/5 blur-3xl" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-xl">
          <Image
            src="/app-icon.png"
            alt="Paltuu"
            width={64}
            height={64}
            className="rounded-2xl"
            priority
          />
        </div>

        <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">
          Get the <span className="text-[#a03048]">Paltuu</span> app
        </h1>
        <p className="mb-10 max-w-sm leading-relaxed text-gray-600">
          Adopt pets, book at-home vet visits in Karachi, shop pet essentials,
          and help reunite lost pets — all in one app.
        </p>

        <div className="flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:items-start">
          {ordered.map((b) => {
            const recommended = b.key === platform;
            return (
              <div key={b.key} className="flex flex-col items-center gap-2">
                <Link
                  href={b.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={b.label}
                  className={`inline-flex rounded-xl transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#a03048] ${
                    recommended
                      ? "ring-2 ring-[#a03048] ring-offset-2 ring-offset-white"
                      : ""
                  }`}
                >
                  <Image
                    src={b.src}
                    alt={b.alt}
                    width={b.width}
                    height={48}
                    className="h-12 w-auto"
                  />
                </Link>
                <span className="h-4 text-[11px] font-semibold uppercase tracking-wider text-[#a03048]">
                  {recommended ? "For your device" : ""}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-xs text-gray-400">
          Free &middot; iOS &amp; Android &middot; Made in Karachi
        </p>
      </div>
    </section>
  );
}
