import type { CSSProperties } from "react";
import StickerTaps from "./StickerTaps";

/**
 * The app's pixel stickers (flat SVGs, transparent, no shadow), tucked behind
 * the left and right edges of the page and slowly peeking in on their own
 * timers. Hovering one, or tapping it on a touch screen (StickerTaps), pops it
 * out with a wiggle and a speech bubble in the pixel face.
 *
 * Every screen size. On wide screens (xl) they use the empty margin beside the
 * max-w-6xl content; below that they shrink and stay within the 20 px page
 * gutter, so a peek is very subtle and never covers content (sizes in
 * .peek-sticker, globals.css).
 *
 * The motion is CSS; the only script is StickerTaps for touch. The page stays
 * a server component and static. Decorative only:
 * aria-hidden, no links, not focusable. The parent <main> must be `relative
 * overflow-hidden`, which clips the hidden part at the screen edge. Peeking
 * stops under prefers-reduced-motion.
 */

// Alternating right, left, right, left, right down the page: pigeon first,
// strawberry last (founder, 2026-11-09).
const STICKERS = [
    { src: "/landing/stickers/pigeon-toast.svg", w: 240, h: 240, side: "right", top: "10%", rot: -12, delay: 0, say: "Coo!" },
    { src: "/landing/stickers/screaming-cat.svg", w: 200, h: 240, side: "left", top: "28%", rot: 8, delay: 4.2, say: "AAAA!" },
    { src: "/landing/stickers/frog-dog.svg", w: 200, h: 250, side: "right", top: "46%", rot: -8, delay: 1.8, say: "Ribbit?" },
    { src: "/landing/stickers/duck.svg", w: 240, h: 240, side: "left", top: "64%", rot: 6, delay: 6.5, say: "Quack!" },
    { src: "/landing/stickers/strawberry.svg", w: 240, h: 240, side: "right", top: "82%", rot: 10, delay: 3.1, say: "Hi!" },
] as const;

export default function PeekingStickers() {
    return (
        <div aria-hidden="true" data-landing-stickers className="pointer-events-none absolute inset-0 z-10">
            {STICKERS.map((s, i) => (
                <div
                    key={s.src}
                    className="peek-sticker"
                    data-side={s.side}
                    data-sticker={i}
                    style={{ top: s.top, "--rot": `${s.rot}deg`, "--delay": `${s.delay}s` } as CSSProperties}
                >
                    <div className="peek-sticker-inner">
                        <span className="peek-sticker-bubble font-pixel">{s.say}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt="" width={s.w} height={s.h} loading="lazy" draggable={false} />
                    </div>
                </div>
            ))}
            {/* Touch screens only: a tap strip along the edge, the width of the page
                gutter, so the sticker is easy to hit without covering content. */}
            {STICKERS.map((s, i) => (
                <span key={`hit-${s.src}`} className="peek-sticker-hit" data-side={s.side} data-sticker={i} style={{ top: s.top }} />
            ))}
            <StickerTaps />
        </div>
    );
}
