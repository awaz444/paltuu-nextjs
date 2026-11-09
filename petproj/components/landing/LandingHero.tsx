import Link from "next/link";
import type { ReactNode } from "react";
import AppStoreBadges from "@/components/home/AppStoreBadges";

/**
 * The hero for all three landing pages. Phone first: one column, centred, with
 * one very large call to action (85% of visitors are on phones).
 *
 * SEO: the Karachi and Pakistan heroes keep every link the old hero had
 * (/browse-pets, /create-listing, /pet-care and the app badges), with the same
 * data-cta names so analytics keep lining up.
 */

interface Cta {
    label: string;
    href: string;
    cta?: string;
}

export default function LandingHero({
    eyebrow,
    title,
    body,
    primary,
    secondary,
    tertiary,
    appLine,
}: {
    eyebrow: string;
    title: ReactNode;
    body: ReactNode;
    primary: Cta;
    secondary: Cta;
    tertiary?: Cta;
    appLine: string;
}) {
    return (
        <section aria-labelledby="hero-heading" className="bg-white px-5 pb-12 pt-11 text-center md:pb-20 md:pt-20">
            <div className="mx-auto max-w-3xl">
                <p className="mb-4 inline-flex rounded-full bg-gray-100 px-3.5 py-1.5 text-[13px] font-semibold text-gray-700">
                    {eyebrow}
                </p>
                <h1
                    id="hero-heading"
                    className="mb-4 text-[38px] font-bold leading-[1.06] tracking-tight text-gray-900 sm:text-5xl lg:text-[76px]"
                >
                    {title}
                </h1>
                <p className="mx-auto mb-7 max-w-xl text-[15px] leading-relaxed text-gray-600 md:text-lg">{body}</p>

                <Link
                    href={primary.href}
                    data-cta={primary.cta}
                    className="mx-auto flex min-h-16 max-w-md items-center justify-center gap-2.5 rounded-2xl bg-primary text-[19px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                    {primary.label}
                    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                </Link>
                <Link
                    href={secondary.href}
                    data-cta={secondary.cta}
                    className="mx-auto mt-3 flex min-h-[54px] max-w-md items-center justify-center rounded-2xl border-[1.5px] border-primary bg-white text-base font-semibold text-primary transition-colors hover:bg-primary-soft"
                >
                    {secondary.label}
                </Link>
                {tertiary && (
                    <Link
                        href={tertiary.href}
                        data-cta={tertiary.cta}
                        className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
                    >
                        {tertiary.label} →
                    </Link>
                )}

                <div className="mt-7 border-t border-gray-100 pt-5">
                    <p className="mb-3 text-[13px] font-semibold text-gray-700">{appLine}</p>
                    <AppStoreBadges className="justify-center" />
                </div>
            </div>
        </section>
    );
}
