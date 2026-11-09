"use client";

import { useEffect } from "react";

/**
 * Tap support for PeekingStickers on touch screens. Phones have no hover, and
 * the sticker shows only 9–18 px, so each one gets an invisible tap strip along
 * the screen edge (.peek-sticker-hit, as wide as the page gutter). Tapping the
 * strip or the sticker pops it out (.is-popped) and it tucks itself back after
 * a moment. Renders nothing; the stickers themselves stay server-rendered.
 */
const POP_MS = 2200;

export default function StickerTaps() {
    useEffect(() => {
        const timers = new Map<Element, number>();

        const pop = (id: string | undefined) => {
            const sticker = id ? document.querySelector(`.peek-sticker[data-sticker="${id}"]`) : null;
            if (!sticker) return;
            window.clearTimeout(timers.get(sticker));
            sticker.classList.add("is-popped");
            timers.set(
                sticker,
                window.setTimeout(() => sticker.classList.remove("is-popped"), POP_MS)
            );
        };

        // Listeners on the elements themselves: iOS Safari won't deliver a tap
        // to a non-interactive element through a document-level listener.
        const targets = Array.from(document.querySelectorAll<HTMLElement>(".peek-sticker-hit, .peek-sticker"));
        const onTap = (e: Event) => pop((e.currentTarget as HTMLElement).dataset.sticker);
        targets.forEach((el) => el.addEventListener("click", onTap));

        return () => {
            targets.forEach((el) => el.removeEventListener("click", onTap));
            timers.forEach((t) => window.clearTimeout(t));
        };
    }, []);

    return null;
}
