"use client";

import { useEffect, useRef, useState } from "react";

/** Round avatar. Falls back to the author's initial when there's no photo or the URL is dead. */
export default function Avatar({ src, name, size = 36 }: { src: string | null; name: string; size?: number }) {
    const [failed, setFailed] = useState(false);
    const ref = useRef<HTMLImageElement>(null);

    // A server-rendered <img> can fail before hydration, when onError isn't attached yet.
    useEffect(() => {
        const img = ref.current;
        if (img && img.complete && img.naturalWidth === 0) setFailed(true);
    }, []);
    const style = { width: size, height: size };

    if (src && !failed) {
        return (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                ref={ref}
                src={src}
                alt=""
                style={style}
                className="shrink-0 rounded-full object-cover"
                loading="lazy"
                onError={() => setFailed(true)}
            />
        );
    }
    return (
        <span
            aria-hidden
            style={{ ...style, fontSize: Math.round(size * 0.42) }}
            className="flex shrink-0 items-center justify-center rounded-full bg-primary/15 font-semibold text-primary"
        >
            {name.trim().charAt(0).toUpperCase() || "P"}
        </span>
    );
}
