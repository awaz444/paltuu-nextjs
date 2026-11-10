"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import { STICKERS } from "@/components/landing/PeekingStickers";

/**
 * The landing page's pixel stickers (components/landing/PeekingStickers),
 * across the rest of the web app. Rendered once in the root layout.
 *
 * Unlike the landing page, where five stickers are spread down one long page,
 * here two stickers are fixed to the screen edges (one left, one right) and
 * travel with the scroll, so they work the same on a short form and on an
 * endless pet list. Which two and how high is random (each keeps its landing
 * page side, so it's one left sticker and one right one), picked again
 * every time a page opens. They're picked in the browser after load (the server
 * renders none), which nobody notices since they start tucked behind the edge.
 *
 * Mostly tucked behind the edge (a few px show). On desktop they peek in on
 * their own timers (CSS); on phones one peeks out only now and then, at random
 * (below). Hover or tap pops one out with a wiggle and a speech bubble. Same
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

// Every sticker keeps the side and tilt it has on the landing page (founder,
// 2026-11-11): the screaming cat and the duck always on the left; the pigeon,
// the frog dog and the strawberry always on the right.
const LEFT = STICKERS.filter((s) => s.side === "left");
const RIGHT = STICKERS.filter((s) => s.side === "right");

const POP_MS = 2200;
const PEEK_MS = 2400;
// Same breakpoint as the phone rules for .app-stickers in globals.css.
const PHONE = "(max-width: 1023px)";

const random = (n: number) => Math.floor(Math.random() * n);

/** A random left sticker and a random right one, one higher than the other. */
function pick() {
    const left = LEFT[random(LEFT.length)];
    const right = RIGHT[random(RIGHT.length)];
    const leftHigher = random(2) === 0;
    // Kept between 30% and 72% of the screen: clear of the navbar at the top,
    // and of the cookie bar, toasts and bottom buttons at the bottom.
    const high = 30 + random(18);
    const low = 54 + random(18);
    return [
        { ...left, top: leftHigher ? high : low, delay: leftHigher ? 1.5 : 7 },
        { ...right, top: leftHigher ? low : high, delay: leftHigher ? 7 : 1.5 },
    ];
}

export default function AppStickers() {
    const pathname = usePathname() ?? "/";
    const layer = useRef<HTMLDivElement>(null);
    const hidden = HIDE_ON.some((p) => pathname.startsWith(p));
    const [stickers, setStickers] = useState<ReturnType<typeof pick> | null>(null);

    // A new random pair on every page.
    useEffect(() => {
        setStickers(hidden ? null : pick());
    }, [pathname, hidden]);

    // Taps on touch screens: pop the sticker out, tuck it back after a moment.
    // Listeners go on the elements themselves (iOS Safari won't deliver a tap on
    // a non-interactive element to a listener further up), and are re-attached
    // whenever a new pair is picked, since the layout and this layer stay mounted.
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
    }, [stickers]);

    // Phones: no peeking on a loop (that's for desktop, in CSS). Instead, now
    // and then, one of the two stickers peeks out for a moment: the first time
    // 8 to 20 s after the page opens, then every 30 to 60 s. Nothing under
    // prefers-reduced-motion.
    useEffect(() => {
        const root = layer.current;
        if (!root || !window.matchMedia(PHONE).matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        let timer = 0;
        const between = (min: number, max: number) => (min + Math.random() * (max - min)) * 1000;
        const peek = () => {
            const els = root.querySelectorAll(".peek-sticker");
            const sticker = els[Math.floor(Math.random() * els.length)];
            sticker?.classList.add("is-peeking");
            timer = window.setTimeout(() => {
                sticker?.classList.remove("is-peeking");
                timer = window.setTimeout(peek, between(30, 60));
            }, PEEK_MS);
        };
        timer = window.setTimeout(peek, between(8, 20));
        return () => window.clearTimeout(timer);
    }, [stickers]);

    if (hidden || !stickers) return null;

    return (
        <div ref={layer} aria-hidden="true" className="app-stickers">
            {stickers.map((s, i) => (
                <div
                    key={`${s.src}-${i}`}
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
                    key={`hit-${s.src}-${i}`}
                    className="peek-sticker-hit"
                    data-side={s.side}
                    data-app-sticker={i}
                    style={{ top: `${s.top}%` }}
                />
            ))}
        </div>
    );
}
