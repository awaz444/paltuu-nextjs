"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { usePathname } from "next/navigation";

/**
 * The landing page's pixel stickers (components/landing/PeekingStickers),
 * across the rest of the web app. Rendered once in the root layout.
 *
 * Unlike the landing page, where five stickers are spread down one long page,
 * here two stickers are fixed to the screen edges (one left, one right) and
 * travel with the scroll, so they work the same on a short form and on an
 * endless pet list. Which two, and where, comes from the page's address: every
 * page has its own pair, the same on every visit and on the server, so nothing
 * flickers in after load.
 *
 * Mostly tucked behind the edge (a few px show), they peek in on their own
 * timers; hover or tap pops one out with a wiggle and a speech bubble. Same
 * styles as the landing (.peek-sticker in globals.css), sized for app pages by
 * .app-stickers. Decorative only: aria-hidden, not focusable. No motion under
 * prefers-reduced-motion.
 *
 * Pages that shouldn't have them go in HIDE_ON. Pages that render the landing
 * stickers themselves hide this layer in CSS (body:has([data-landing-stickers])),
 * so "/" shows the landing's stickers to visitors and these to signed-in users.
 */

// Matched as the start of the path, so "/admin" covers "/admin-panel" and
// "/vet-" covers every vet sign-up step.
const HIDE_ON = [
    // Signing in and up
    "/login", "/sign-up", "/auth", "/forgot-password", "/reset-password", "/beta-signup", "/success",
    // Paying
    "/cart", "/checkout", "/payment-confirmation", "/order-confirmed",
    // Admin and partner panels
    "/admin", "/shop-panel", "/rescue-panel", "/vendor-panel", "/bazaar-admin", "/manage-clinics",
    // Vet, shop and rescue sign-up steps
    "/vet-", "/partner-signup", "/shop-register", "/rescue-register",
    // Listing forms
    "/create-listing", "/lost-and-found-create-listing", "/upload-images", "/bulk-upload-pets",
    // Legal and utility pages
    "/privacy-policy", "/app-privacy-policy", "/terms-and-conditions", "/refund", "/shipping-policy",
    "/child-safety", "/delete-account", "/api-docs", "/pwa-debug", "/open",
];

const ART = [
    { src: "/landing/stickers/pigeon-toast.svg", w: 240, h: 240, say: "Coo!" },
    { src: "/landing/stickers/screaming-cat.svg", w: 200, h: 240, say: "AAAA!" },
    { src: "/landing/stickers/frog-dog.svg", w: 200, h: 250, say: "Ribbit?" },
    { src: "/landing/stickers/duck.svg", w: 240, h: 240, say: "Quack!" },
    { src: "/landing/stickers/strawberry.svg", w: 240, h: 240, say: "Hi!" },
] as const;

const POP_MS = 2200;

/** Small stable hash (djb2), so the pick is the same on the server and client. */
function hash(s: string) {
    let h = 5381;
    for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
    return h;
}

/** Two different stickers for this page: one on each side, at different heights. */
function pick(pathname: string) {
    const h = hash(pathname);
    const first = h % ART.length;
    const second = (first + 1 + ((h >>> 4) % (ART.length - 1))) % ART.length;
    const leftFirst = ((h >>> 8) & 1) === 0;
    const tilt = 6 + ((h >>> 9) % 7); // 6 to 12 degrees
    // Kept between 30% and 72% of the screen: clear of the navbar at the top,
    // and of the cookie bar, toasts and bottom buttons at the bottom.
    return [
        { ...ART[first], side: leftFirst ? "left" : "right", top: 30 + ((h >>> 12) % 18), rot: leftFirst ? tilt : -tilt, delay: 1.5 },
        { ...ART[second], side: leftFirst ? "right" : "left", top: 54 + ((h >>> 17) % 18), rot: leftFirst ? -tilt : tilt, delay: 7 },
    ];
}

export default function AppStickers() {
    const pathname = usePathname() ?? "/";
    const layer = useRef<HTMLDivElement>(null);
    const hidden = HIDE_ON.some((p) => pathname.startsWith(p));

    // Taps on touch screens: pop the sticker out, tuck it back after a moment.
    // Listeners go on the elements themselves (iOS Safari won't deliver a tap on
    // a non-interactive element to a listener further up), and are re-attached
    // on every page change, since the layout and this layer stay mounted.
    useEffect(() => {
        const root = layer.current;
        if (!root) return;
        const timers = new Map<Element, number>();
        const onTap = (e: Event) => {
            const id = (e.currentTarget as HTMLElement).dataset.appSticker;
            const sticker = root.querySelector(`.peek-sticker[data-app-sticker="${id}"]`);
            if (!sticker) return;
            window.clearTimeout(timers.get(sticker));
            sticker.classList.add("is-popped");
            timers.set(sticker, window.setTimeout(() => sticker.classList.remove("is-popped"), POP_MS));
        };
        const targets = Array.from(root.querySelectorAll<HTMLElement>("[data-app-sticker]"));
        targets.forEach((el) => el.addEventListener("click", onTap));
        return () => {
            targets.forEach((el) => el.removeEventListener("click", onTap));
            timers.forEach((t) => window.clearTimeout(t));
        };
    }, [pathname, hidden]);

    if (hidden) return null;
    const stickers = pick(pathname);

    return (
        <div ref={layer} aria-hidden="true" className="app-stickers">
            {stickers.map((s, i) => (
                <div
                    key={`${pathname}-${i}`}
                    className="peek-sticker"
                    data-side={s.side}
                    data-app-sticker={i}
                    style={{ top: `${s.top}%`, "--rot": `${s.rot}deg`, "--delay": `${s.delay}s` } as CSSProperties}
                >
                    <div className="peek-sticker-inner">
                        <span className="peek-sticker-bubble font-pixel">{s.say}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt="" width={s.w} height={s.h} loading="lazy" draggable={false} />
                    </div>
                </div>
            ))}
            {stickers.map((s, i) => (
                <span
                    key={`hit-${pathname}-${i}`}
                    className="peek-sticker-hit"
                    data-side={s.side}
                    data-app-sticker={i}
                    style={{ top: `${s.top}%` }}
                />
            ))}
        </div>
    );
}
