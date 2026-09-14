import Link from "next/link";
import { VET_CITIES } from "@/lib/vetCities";
import { VET_CLINIC_COUNTS } from "@/lib/homeContent";
import Reveal from "./Reveal";

/**
 * The "vets near me" section — the page's main play for that query.
 *
 * The H2 carries the phrase verbatim and the city columns are driven by
 * VET_CITIES so this can't drift out of sync with the sitemap, the footer and
 * /pet-care/[slug]. The clarifying line about clinics being independent is the
 * same platform-not-provider point the rest of the page makes, applied to vets.
 */
export default function VetDirectorySection() {
    return (
        <section
            className="bg-white px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="vets-near-me-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-3xl mb-9">
                    <h2
                        id="vets-near-me-heading"
                        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3"
                    >
                        Find vets near me: clinics, hospitals &amp; veterinary doctors
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed mb-3">
                        Whether you want to{" "}
                        <Link
                            href="/browse-pets"
                            className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium"
                        >
                            adopt a dog or cat
                        </Link>
                        , find a{" "}
                        <Link
                            href="/pet-care"
                            className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium"
                        >
                            verified vet near you
                        </Link>
                        , or reunite a{" "}
                        <Link
                            href="/lost-and-found"
                            className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium"
                        >
                            lost pet
                        </Link>{" "}
                        with its family, it starts here, across Karachi, Lahore, Islamabad and the
                        rest of the country.
                    </p>
                    <p className="text-sm text-gray-500">
                        Listings are independent clinics and vets. Paltuu verifies and lists
                        them, it does not employ them.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {VET_CITIES.map((city, i) => (
                        <Reveal key={city} delay={i * 0.06} className="h-full">
                            <Link
                                href={`/pet-care/${city.toLowerCase()}`}
                                className="group h-full flex flex-col rounded-xl border border-gray-200 bg-white p-5 hover:border-primary hover:bg-primary/[0.03] transition-colors"
                            >
                                <span className="text-2xl font-extrabold text-primary tabular-nums">
                                    {VET_CLINIC_COUNTS[city]}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                                    listed clinics &amp; vets
                                </span>
                                <h3 className="text-base font-bold text-gray-900">
                                    Vets near me in {city}
                                </h3>
                                <span className="mt-auto pt-4 text-sm font-semibold text-primary group-hover:underline">
                                    Browse {city} clinics →
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </div>

                <div className="mt-7">
                    <Link
                        href="/pet-care"
                        className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                    >
                        Browse all verified vets →
                    </Link>
                </div>
            </div>
        </section>
    );
}
