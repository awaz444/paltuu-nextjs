import Link from "next/link";
import AppStoreBadges from "./AppStoreBadges";

/**
 * The homepage hero, a server component.
 *
 * Its job is to answer "what is this?" before the visitor scrolls. The old hero
 * led with "Pakistan's first pet super app", which describes status rather than
 * mechanics and left people phoning to ask whether we hand out cats. The
 * headline now states the two-sided transaction, and the three cards on the
 * right show the three things a visitor can actually do here.
 *
 * No illustrations and no decorative icons: the cards carry the section, and
 * the content is the design. No animation either, since this is the LCP region.
 */

const ACTIONS = [
    {
        title: "Adopt a pet",
        desc: "Browse dogs, cats, puppies and kittens listed near you.",
        href: "/browse-pets",
    },
    {
        title: "List a pet for adoption",
        desc: "Rehoming your pet? List them free and choose who they go to.",
        href: "/create-listing",
    },
    {
        title: "Find a vet near you",
        desc: "Clinics, animal hospitals and veterinary doctors by city.",
        href: "/pet-care",
    },
];

export default function HeroSection() {
    return (
        <section className="bg-white text-gray-900 px-6 lg:px-12 pt-10 pb-12 md:pt-16 md:pb-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-[1.1fr_1fr] gap-10 md:gap-12 items-stretch">
                <div>
                    <p className="text-xs md:text-sm font-semibold uppercase tracking-wider text-primary mb-3">
                        Connecting pets and parents across Pakistan
                    </p>

                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.12] mb-4">
                        Adopt a pet,
                        <span className="block text-primary">or find one a home.</span>
                    </h1>

                    {/* Kept short on purpose. The SEO weight sits in the h1, the
                        title/meta and the section headings below, not in hero body
                        copy, and every claim past this point is made again further
                        down the page. The brand spellings have to survive here
                        because they appear nowhere else.

                        This sells rather than disclaims: "from the family or
                        shelter rehoming them" carries the platform model without
                        stating it as a denial. The blunt version of that point
                        ("Paltuu never takes custody of the animal") lives in the
                        pillar card and in the first FAQ, where a defensive tone
                        is appropriate and expected. */}
                    <p className="text-base text-gray-600 leading-relaxed mb-6 max-w-lg">
                        <span className="font-semibold text-gray-900">Paltuu.pk</span> (also
                        searched as Paltu or Paaltuu) is Pakistan&apos;s pet adoption
                        platform. Find a pet from the family or shelter rehoming them, or{" "}
                        <span className="font-semibold text-gray-900">
                            list your own and choose the home they go to
                        </span>
                        . Free, either way.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link
                            href="/browse-pets"
                            className="inline-flex items-center justify-center bg-primary text-white font-semibold px-6 py-3 rounded-full text-sm shadow-sm hover:opacity-90 transition-opacity"
                        >
                            Browse pets for adoption
                        </Link>
                        <Link
                            href="/create-listing"
                            className="inline-flex items-center justify-center bg-white text-primary border border-primary font-semibold px-6 py-3 rounded-full text-sm hover:bg-primary/5 transition-colors"
                        >
                            List a pet for adoption
                        </Link>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <p className="text-sm font-semibold text-gray-900 mb-3">
                            The whole community lives in the Paltuu app.
                        </p>
                        <AppStoreBadges />
                    </div>
                </div>

                <ul className="flex flex-col justify-center gap-3">
                    {ACTIONS.map(({ title, desc, href }) => (
                        <li key={title} className="flex-1">
                            <Link
                                href={href}
                                className="group flex h-full flex-col justify-center rounded-xl border border-gray-200 bg-white px-5 py-4 hover:border-primary hover:bg-primary/[0.03] transition-colors"
                            >
                                <span className="block font-bold text-gray-900 group-hover:text-primary transition-colors">
                                    {title}
                                </span>
                                <span className="block text-sm text-gray-600 mt-1 leading-relaxed">
                                    {desc}
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
