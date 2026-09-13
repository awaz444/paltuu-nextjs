import Link from "next/link";
import { House, Check, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import AppStoreBadges from "./AppStoreBadges";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * The one service Paltuu provides rather than brokers.
 *
 * Booking lives entirely in the mobile app, so the CTA goes through the
 * /open?path=express-vet bridge (app/open/OpenClient.tsx), which hands off to
 * paltuu://express-vet and falls back to the store buttons if the app isn't
 * installed. This section is the first web entry point to the service.
 *
 * The "not in Karachi?" line matters: without it the section dead-ends for the
 * majority of visitors.
 */
export default function VetsAtHomeSection() {
    return (
        <section
            className="py-16 md:py-20 px-6 lg:px-20 bg-primary"
            aria-labelledby="vets-at-home-heading"
        >
            <div className="max-w-5xl mx-auto">
                <Reveal>
                    <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl">
                        <div className="flex flex-col md:flex-row md:items-start gap-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-5">
                                    <span className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                                        <House size={22} className="text-white" aria-hidden="true" />
                                    </span>
                                    <span className="text-[11px] font-bold uppercase tracking-wide bg-primary/10 text-primary px-3 py-1.5 rounded-full">
                                        {VETS_AT_HOME.city} only
                                    </span>
                                </div>

                                <h2
                                    id="vets-at-home-heading"
                                    className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 leading-tight"
                                >
                                    Our own vets. At your door.
                                    <span className="block text-primary">
                                        {VETS_AT_HOME.city}, for now.
                                    </span>
                                </h2>

                                <p className="text-lg text-gray-600 leading-relaxed mb-6">
                                    Everything else on Paltuu connects you to someone else.{" "}
                                    <span className="font-semibold text-gray-900">
                                        Vets at Home is ours.
                                    </span>{" "}
                                    We send a veterinary doctor to your home — no carrier, no
                                    traffic, no waiting room. Prices are confirmed on a call
                                    before anyone is dispatched.
                                </p>

                                <ul className="flex flex-wrap gap-2 mb-8">
                                    {VETS_AT_HOME.services.map((service) => (
                                        <li
                                            key={service}
                                            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-200 rounded-full px-3.5 py-1.5"
                                        >
                                            <Check size={14} className="text-primary" aria-hidden="true" />
                                            {service}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href={VETS_AT_HOME.deepLink}
                                    className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-8 py-4 rounded-full text-base shadow-lg hover:scale-105 transition-transform duration-300"
                                >
                                    Book in the Paltuu app
                                    <ArrowRight size={18} aria-hidden="true" />
                                </Link>

                                <AppStoreBadges className="mt-6" />

                                <p className="mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600">
                                    Not in {VETS_AT_HOME.city}?{" "}
                                    <Link
                                        href="/pet-care"
                                        className="text-primary font-semibold underline decoration-primary/40 hover:decoration-primary"
                                    >
                                        Find a clinic near you →
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
