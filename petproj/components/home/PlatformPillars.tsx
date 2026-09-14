import Link from "next/link";
import Reveal from "./Reveal";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * The three things Paltuu does, stated as who-does-what.
 *
 * The editorial point is the contrast between the first two and the third:
 * adoption and the vet directory are things Paltuu connects you to, Vets at
 * Home is the one thing Paltuu provides. The third card carries a label and a
 * border instead of an icon, so the difference reads without decoration.
 */

const PILLARS = [
    {
        title: "Adopt and rehome",
        body: (
            <>
                Adopt a pet listed by another owner or a registered shelter, or list your
                own and choose the family it goes to.{" "}
                <span className="font-semibold text-gray-900">
                    Paltuu never takes custody of the animal.
                </span>
            </>
        ),
        links: [
            { href: "/browse-pets", label: "Browse pets" },
            { href: "/create-listing", label: "List a pet" },
        ],
    },
    {
        title: "Vets near you",
        body: (
            <>
                A nationwide directory of vet clinics, animal hospitals and veterinary
                doctors. Search{" "}
                <span className="font-semibold text-gray-900">vets near me</span> by city,
                see what each clinic treats, and contact them yourself.
            </>
        ),
        links: [{ href: "/pet-care", label: "Find a vet" }],
    },
];

export default function PlatformPillars() {
    return (
        <section
            className="bg-white px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="pillars-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl mb-10">
                    <h2
                        id="pillars-heading"
                        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3"
                    >
                        What you can actually do here
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                        Paltuu is a platform. People and registered shelters list pets, vets
                        list their clinics, and you deal with them directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {PILLARS.map((pillar, i) => (
                        <Reveal key={pillar.title} delay={i * 0.06} className="h-full">
                            <article className="h-full flex flex-col rounded-xl border border-gray-200 bg-white p-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-2">
                                    {pillar.title}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed flex-grow">
                                    {pillar.body}
                                </p>
                                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 pt-4 border-t border-gray-100 text-sm font-semibold">
                                    {pillar.links.map((l) => (
                                        <Link
                                            key={l.label}
                                            href={l.href}
                                            className="text-primary hover:underline"
                                        >
                                            {l.label} →
                                        </Link>
                                    ))}
                                </div>
                            </article>
                        </Reveal>
                    ))}

                    {/* The odd one out, and it should look like it. */}
                    <Reveal delay={0.12} className="h-full">
                        <article className="h-full flex flex-col rounded-xl border-2 border-primary bg-primary/[0.04] p-6">
                            <div className="flex items-center justify-between gap-3 mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    Vets at Home
                                </h3>
                                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide text-primary">
                                    {VETS_AT_HOME.city} only
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 leading-relaxed flex-grow">
                                <span className="font-semibold text-gray-900">
                                    This one is ours.
                                </span>{" "}
                                Paltuu&apos;s own veterinary doctors come to your door for
                                check-ups, vaccinations and grooming. No carrier, no traffic, no
                                waiting room.
                            </p>
                            <div className="mt-5 pt-4 border-t border-primary/20 text-sm font-semibold">
                                <Link
                                    href={VETS_AT_HOME.deepLink}
                                    className="text-primary hover:underline"
                                >
                                    Book in the app →
                                </Link>
                            </div>
                        </article>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
