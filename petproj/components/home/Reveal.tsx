"use client";

import { m, useReducedMotion } from "framer-motion";

/**
 * The homepage's only animation primitive: a short fade-and-rise as an element
 * scrolls into view, once.
 *
 * The travel is deliberately tiny (16px, transform-only) — enough to feel alive,
 * not enough to read as jank or to cause layout shift. Like MotionProvider it
 * takes `children`, so the content inside is server-rendered.
 */
export default function Reveal({
    children,
    delay = 0,
    className,
}: {
    children: React.ReactNode;
    /** Stagger index or explicit seconds; pass `index * 0.06` for a group. */
    delay?: number;
    className?: string;
}) {
    const reduceMotion = useReducedMotion();

    if (reduceMotion) return <div className={className}>{children}</div>;

    return (
        <m.div
            className={className}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15, margin: "0px 0px -10% 0px" }}
            transition={{ duration: 0.45, ease: "easeOut", delay }}
        >
            {children}
        </m.div>
    );
}
