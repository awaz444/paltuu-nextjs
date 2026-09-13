"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { HOME_STATS, type HomeStat } from "@/lib/homeContent";

/**
 * The stat band, with numbers that count up once as they scroll into view.
 *
 * Each figure renders at its final value on the server, so crawlers and no-JS
 * visitors see the real number and there is no layout shift when the counter
 * starts. `tabular-nums` keeps the digits from reflowing mid-count.
 */

const DURATION_MS = 1200;

function Counter({ stat }: { stat: HomeStat }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.4 });
    const reduceMotion = useReducedMotion();
    const [display, setDisplay] = useState(stat.value);

    useEffect(() => {
        if (reduceMotion) return;
        // Start from zero only once we know JS is running, so the server HTML
        // keeps the final value and nothing flashes for no-JS visitors.
        setDisplay(0);
    }, [reduceMotion]);

    useEffect(() => {
        if (!inView || reduceMotion) return;

        let frame = 0;
        const start = performance.now();

        const tick = (now: number) => {
            const progress = Math.min((now - start) / DURATION_MS, 1);
            // easeOutCubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(stat.value * eased));
            if (progress < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
    }, [inView, reduceMotion, stat.value]);

    return (
        <span
            ref={ref}
            className="text-3xl lg:text-4xl font-extrabold text-primary mb-2 tabular-nums"
        >
            {display.toLocaleString("en-US")}
            {stat.suffix ?? ""}
        </span>
    );
}

export default function ImpactStats() {
    return (
        <section
            className="py-16 md:py-20 px-6 lg:px-20 bg-white"
            aria-labelledby="impact-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10 max-w-2xl mx-auto">
                    <h2
                        id="impact-heading"
                        className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3"
                    >
                        Making a difference
                    </h2>
                    <p className="text-lg text-gray-600">
                        Numbers from the Paltuu community across Pakistan — every one of them
                        a life touched and a story changed.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                    {HOME_STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="bg-primary/5 p-6 rounded-2xl border border-primary/10 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform duration-300"
                        >
                            <Counter stat={stat} />
                            <span className="text-xs md:text-sm font-bold text-gray-600 uppercase tracking-wide">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
