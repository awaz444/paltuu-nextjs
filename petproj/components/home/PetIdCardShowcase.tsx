"use client";

import { useRef } from "react";
import { m, useMotionValue, useSpring, useTransform, useReducedMotion } from "framer-motion";

const MAX_TILT = 8;

/**
 * A pointer-tracking 3D tilt for the Pet Identity Card.
 *
 * Takes the card as `children` so PetIdCard itself stays a server component —
 * this wrapper only adds the motion. Tilt is desktop-pointer only: on a
 * touchscreen there is no hover, and tracking touch here would fight scrolling.
 */
export default function PetIdCardShowcase({ children }: { children: React.ReactNode }) {
    const ref = useRef<HTMLDivElement>(null);
    const reduceMotion = useReducedMotion();

    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const springX = useSpring(x, { stiffness: 150, damping: 18 });
    const springY = useSpring(y, { stiffness: 150, damping: 18 });

    const rotateY = useTransform(springX, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]);
    const rotateX = useTransform(springY, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]);

    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (reduceMotion || e.pointerType !== "mouse" || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };

    const reset = () => {
        x.set(0);
        y.set(0);
    };

    if (reduceMotion) return <div className="flex justify-center w-full">{children}</div>;

    return (
        <div
            ref={ref}
            onPointerMove={handlePointerMove}
            onPointerLeave={reset}
            className="flex justify-center w-full"
            style={{ perspective: 1200 }}
        >
            {/* PetIdCard's .shell is width:100% with a 384px cap, so this wrapper
                needs a definite width — as a bare flex item it would size to
                content and collapse the card to zero. */}
            <m.div
                className="w-full max-w-[384px]"
                initial={{ opacity: 0, y: 24, rotate: -4 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
            >
                {children}
            </m.div>
        </div>
    );
}
