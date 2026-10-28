import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Page not found | Paltuu.pk",
    robots: { index: false },
};

const LINKS = [
    { href: "/browse-pets", label: "Adopt a pet" },
    { href: "/pet-care", label: "Find a vet" },
    { href: "/lost-and-found", label: "Lost & Found" },
];

/** Site-wide 404, also shown wherever a page calls notFound(). */
export default function NotFound() {
    return (
        <main className="flex flex-1 items-center justify-center bg-white px-4 py-16">
            <div className="w-full max-w-md text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/icons/features/sad-cat.jpg" alt="" aria-hidden width={192} height={192} className="mx-auto h-48 w-48" />
                <h1 className="mt-4 text-2xl font-bold text-gray-900">We couldn&apos;t find that page</h1>
                <p className="mt-2 text-sm text-gray-600">
                    It may have moved, or the listing was adopted or taken down.
                </p>
                <Link href="/home" className="mt-6 inline-block rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90">
                    Back to Paltuu
                </Link>
                <nav aria-label="Popular pages" className="mt-6 flex flex-wrap justify-center gap-2">
                    {LINKS.map((l) => (
                        <Link
                            key={l.href}
                            href={l.href}
                            className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-primary hover:text-primary"
                        >
                            {l.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </main>
    );
}
