import Link from "next/link";
import { Repeat, MapPin, House } from "lucide-react";
import Reveal from "./Reveal";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * The three things Paltuu does, stated as who-does-what.
 *
 * The editorial point is the contrast between the first two cards and the
 * third: adoption and the vet directory are things Paltuu *connects* you to,
 * Vets at Home is the one thing Paltuu *provides*. The third card is styled
 * differently on purpose so that difference is visible before it is read.
 */
export default function PlatformPillars() {
    return (
        <section
            className="py-16 md:py-20 px-6 lg:px-20 bg-primary"
            aria-labelledby="pillars-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-12 max-w-3xl mx-auto">
                    <h2
                        id="pillars-heading"
                        className="text-3xl md:text-4xl font-extrabold text-white mb-4"
                    >
                        What you can actually do here
                    </h2>
                    <p className="text-lg text-white/90">
                        Paltuu is a platform. People and registered shelters list pets,
                        vets list their clinics, and you deal with them directly.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Reveal delay={0} className="h-full">
                        <article className="h-full bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col">
                            <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                                <Repeat size={22} className="text-primary" aria-hidden="true" />
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Adopt &amp; rehome
                            </h3>
                            <p className="text-gray-600 leading-relaxed flex-grow">
                                Adopt a pet listed by another owner or a registered shelter — or
                                list your own and choose the family it goes to.{" "}
                                <span className="font-semibold text-gray-900">
                                    Paltuu never takes custody of the animal.
                                </span>
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-5 pt-4 border-t border-gray-100 text-sm font-semibold">
                                <Link href="/browse-pets" className="text-primary hover:underline">
                                    Browse pets →
                                </Link>
                                <Link href="/create-listing" className="text-primary hover:underline">
                                    List a pet →
                                </Link>
                            </div>
                        </article>
                    </Reveal>

                    <Reveal delay={0.06} className="h-full">
                        <article className="h-full bg-white rounded-2xl p-7 shadow-sm border border-gray-100 flex flex-col">
                            <span className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5">
                                <MapPin size={22} className="text-primary" aria-hidden="true" />
                            </span>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Vets near you
                            </h3>
                            <p className="text-gray-600 leading-relaxed flex-grow">
                                A nationwide directory of vet clinics, animal hospitals and
                                veterinary doctors. Search{" "}
                                <span className="font-semibold text-gray-900">vets near me</span>{" "}
                                by city, see what each clinic treats, and contact them yourself.
                            </p>
                            <div className="mt-5 pt-4 border-t border-gray-100 text-sm font-semibold">
                                <Link href="/pet-care" className="text-primary hover:underline">
                                    Find a vet →
                                </Link>
                            </div>
                        </article>
                    </Reveal>

                    {/* The odd one out, visually and editorially. */}
                    <Reveal delay={0.12} className="h-full">
                        <article className="h-full bg-white rounded-2xl p-7 shadow-lg border-2 border-white ring-4 ring-white/25 flex flex-col">
                            <div className="flex items-center justify-between mb-5">
                                <span className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
                                    <House size={22} className="text-white" aria-hidden="true" />
                                </span>
                                <span className="text-[11px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-3 py-1 rounded-full">
                                    {VETS_AT_HOME.city} only
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                Vets at Home
                            </h3>
                            <p className="text-gray-600 leading-relaxed flex-grow">
                                <span className="font-semibold text-gray-900">
                                    This one&apos;s ours.
                                </span>{" "}
                                Paltuu&apos;s own veterinary doctors come to your door for
                                check-ups, vaccinations and grooming — no carrier, no traffic, no
                                waiting room.
                            </p>
                            <div className="mt-5 pt-4 border-t border-gray-100 text-sm font-semibold">
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
