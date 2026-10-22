"use client";

/**
 * Wrap a brand ad placement so it reports per-slot impressions and clicks to
 * the admin traffic dashboard. An impression is counted once per page view,
 * when at least half of the slot has been on screen.
 *
 *   <AdSlot slot="home_hero_banner"><BrandBanner /></AdSlot>
 *
 * Use a stable, descriptive slot name — it's what sales sees in the report.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";

export default function AdSlot({
    slot,
    className,
    children,
}: {
    slot: string;
    className?: string;
    children: React.ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const pathname = usePathname();

    useEffect(() => {
        const el = ref.current;
        if (!el || typeof IntersectionObserver === "undefined") return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    trackEvent("ad_impression", { ad_slot: slot });
                    observer.disconnect();
                }
            },
            { threshold: 0.5 },
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [slot, pathname]);

    return (
        <div ref={ref} data-ad-slot={slot} className={className}>
            {children}
        </div>
    );
}
