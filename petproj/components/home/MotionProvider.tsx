"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * Single framer-motion boundary for the homepage.
 *
 * Importing `motion` directly in every section would pull ~35kb gz onto the
 * landing page. LazyMotion keeps the synchronous bundle at ~5kb and loads the
 * feature set after hydration; `strict` enforces that by making `motion.*`
 * throw, so children must use `m.*`.
 *
 * It takes `children`, which means every section passed through it stays a
 * server component and is fully rendered into the HTML. Scroll animation costs
 * us nothing in crawlability.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
    return (
        <LazyMotion features={domAnimation} strict>
            {children}
        </LazyMotion>
    );
}
