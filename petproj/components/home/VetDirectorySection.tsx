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
            className="py-16 md:py-20 px-6 lg:px-20 bg-white"
            aria-labelledby="vets-near-me-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-3xl mb-12 text-center md:text-left mx-auto md:mx-0">
                    <h2
                        id="vets-near-me-heading"
                        className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
                    >
                        Find vets near me — clinics, hospitals &amp; veterinary doctors
                    </h2>
                    <p className="text-lg text-gray-600 leading-relaxed mb-3">
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
                        with its family, it starts here — across Karachi, Lahore, Islamabad
                        and the rest of the country.
                    </p>
                    <p className="text-sm text-gray-500">
                        Listings are independent clinics and vets. Paltuu verifies and lists
                        them — it doesn&apos;t employ them.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {VET_CITIES.map((city, i) => (
                        <Reveal key={city} delay={i * 0.06} className="h-full">
                            <Link
                                href={`/pet-care/${city.toLowerCase()}`}
                                className="group h-full flex flex-col bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <span className="text-3xl font-extrabold text-primary tabular-nums">
                                    {VET_CLINIC_COUNTS[city]}
                                </span>
                                <span className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">
                                    listed clinics &amp; vets
                                </span>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Vets near me in {city}
                                </h3>
                                <span className="mt-auto pt-4 text-sm font-semibold text-primary group-hover:underline">
                                    Browse {city} clinics →
                                </span>
                            </Link>
                        </Reveal>
                    ))}
                </div>

                <div className="mt-8 text-center md:text-left">
                    <Link
                        href="/pet-care"
                        className="inline-flex items-center gap-2 bg-primary text-white font-bold px-7 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                    >
                        Browse all verified vets →
                    </Link>
                </div>
            </div>
        </section>
    );
}
