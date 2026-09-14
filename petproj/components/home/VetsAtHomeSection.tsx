import Link from "next/link";
import Reveal from "./Reveal";
import AppStoreBadges from "./AppStoreBadges";
import { VETS_AT_HOME } from "@/lib/homeContent";

/**
 * The one service Paltuu provides rather than brokers.
 *
 * Booking lives entirely in the mobile app, so the CTA goes through the
 * /open?path=express-vet bridge (app/open/OpenClient.tsx), which hands off to
 * paltuu://express-vet and falls back to store buttons if the app isn't
 * installed. This section is the first web entry point to the service.
 *
 * Two columns rather than one: the services list fills the right half, which
 * previously sat empty.
 */
export default function VetsAtHomeSection() {
    return (
        <section
            className="bg-primary px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="vets-at-home-heading"
        >
            <div className="max-w-6xl mx-auto">
                <Reveal>
                    <div className="rounded-2xl bg-white p-7 md:p-10">
                        <div className="grid grid-cols-1 md:grid-cols-[1.15fr_1fr] gap-8 md:gap-12">
                            <div className="flex flex-col">
                                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-3">
                                    {VETS_AT_HOME.city} only
                                </p>

                                <h2
                                    id="vets-at-home-heading"
                                    className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-4 leading-tight"
                                >
                                    Our own vets. At your door.
                                </h2>

                                <p className="text-base text-gray-600 leading-relaxed mb-6">
                                    Everything else on Paltuu connects you to someone else.{" "}
                                    <span className="font-semibold text-gray-900">
                                        Vets at Home is ours.
                                    </span>{" "}
                                    We send a veterinary doctor to your home, so there is no
                                    carrier, no traffic and no waiting room. Prices are confirmed
                                    on a call before anyone is dispatched.
                                </p>

                                <div className="mt-auto">
                                    <Link
                                        href={VETS_AT_HOME.deepLink}
                                        className="inline-flex items-center justify-center bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                                    >
                                        Book in the Paltuu app
                                    </Link>

                                    <AppStoreBadges className="mt-5" />

                                    <p className="mt-6 pt-5 border-t border-gray-100 text-sm text-gray-600">
                                        Not in {VETS_AT_HOME.city}?{" "}
                                        <Link
                                            href="/pet-care"
                                            className="text-primary font-semibold underline decoration-primary/40 hover:decoration-primary"
                                        >
                                            Find a clinic near you
                                        </Link>
                                        .
                                    </p>
                                </div>
                            </div>

                            <div className="rounded-xl border border-gray-200 p-5 md:p-6">
                                <h3 className="text-sm font-bold text-gray-900 mb-4">
                                    What we come out for
                                </h3>
                                <ul className="divide-y divide-gray-100">
                                    {VETS_AT_HOME.services.map((service) => (
                                        <li
                                            key={service}
                                            className="py-2.5 text-sm font-medium text-gray-700"
                                        >
                                            {service}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 leading-relaxed">
                                    Every price is a starting price. A dispatcher calls to confirm
                                    the final cost with you before a vet is sent.
                                </p>
                            </div>
                        </div>
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
