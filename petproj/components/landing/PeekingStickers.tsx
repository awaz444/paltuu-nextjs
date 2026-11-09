import type { CSSProperties } from "react";

/**
 * The app's pixel stickers (flat SVGs, transparent, no shadow), hiding behind
 * the left and right edges of the page on wide screens (xl and up, where the
 * max-w-6xl content leaves empty margins). Each one slowly peeks in and back
 * out on its own timer; hovering it
 * pops it out with a wiggle and a speech bubble in the pixel face.
 *
 * Pure CSS (.peek-sticker in globals.css), so the page stays a server component
 * and static. Decorative only: aria-hidden, no links, not focusable. The parent
 * <main> must be `relative overflow-hidden`, which is what clips the hidden half
 * at the viewport edge. Peeking is turned off under prefers-reduced-motion.
 */

const STICKERS = [
    { src: "/landing/stickers/duck.svg", w: 240, h: 240, side: "left", top: "13%", rot: -12, delay: 0, say: "Quack!" },
    { src: "/landing/stickers/strawberry.svg", w: 240, h: 240, side: "right", top: "27%", rot: 10, delay: 3.5, say: "Hi!" },
    { src: "/landing/stickers/screaming-cat.svg", w: 200, h: 240, side: "left", top: "43%", rot: 8, delay: 7, say: "AAAA!" },
    { src: "/landing/stickers/frog-dog.svg", w: 200, h: 250, side: "right", top: "58%", rot: -8, delay: 1.8, say: "Ribbit?" },
    { src: "/landing/stickers/pigeon-toast.svg", w: 240, h: 240, side: "left", top: "74%", rot: 6, delay: 5.2, say: "Coo!" },
] as const;

export default function PeekingStickers() {
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden xl:block">
            {STICKERS.map((s) => (
                <div
                    key={s.src}
                    className="peek-sticker"
                    data-side={s.side}
                    style={{ top: s.top, "--rot": `${s.rot}deg`, "--delay": `${s.delay}s` } as CSSProperties}
                >
                    <div className="peek-sticker-inner">
                        <span className="peek-sticker-bubble font-pixel">{s.say}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={s.src} alt="" width={s.w} height={s.h} loading="lazy" draggable={false} />
                    </div>
                </div>
            ))}
        </div>
    );
}
