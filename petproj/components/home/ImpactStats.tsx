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
            className="text-2xl lg:text-3xl font-extrabold text-primary mb-1 tabular-nums"
        >
            {display.toLocaleString("en-US")}
            {stat.suffix ?? ""}
        </span>
    );
}

export default function ImpactStats() {
    return (
        <section
            className="bg-white px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="impact-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl mb-8">
                    <h2
                        id="impact-heading"
                        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3"
                    >
                        Making a difference
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                        Numbers from the Paltuu community across Pakistan.
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {HOME_STATS.map((stat) => (
                        <div
                            key={stat.label}
                            className="rounded-xl border border-gray-200 p-5 flex flex-col items-start"
                        >
                            <Counter stat={stat} />
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {stat.label}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
