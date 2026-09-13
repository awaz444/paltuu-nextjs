import Link from "next/link";
import Image from "next/image";
import { PawPrint, PlusCircle, Stethoscope, ArrowRight } from "lucide-react";

/**
 * The homepage hero — a server component, deliberately.
 *
 * Its whole job is to answer "what is this?" before the visitor scrolls. The
 * old hero led with "Pakistan's first pet super app", which describes status
 * rather than mechanics and left people phoning to ask whether we hand out cats.
 * The headline now states the two-sided transaction, and the three action cards
 * on the right show the three things a visitor can actually do here.
 *
 * No animation in this section: it is the LCP region.
 */

const ACTIONS = [
    {
        icon: PawPrint,
        title: "Adopt a pet",
        desc: "Browse dogs, cats, puppies and kittens listed near you.",
        href: "/browse-pets",
    },
    {
        icon: PlusCircle,
        title: "List a pet for adoption",
        desc: "Rehoming your pet? List them free and choose who they go to.",
        href: "/create-listing",
    },
    {
        icon: Stethoscope,
        title: "Find a vet near you",
        desc: "Clinics, animal hospitals and veterinary doctors by city.",
        href: "/pet-care",
    },
];

export default function HeroSection() {
    return (
        <section className="bg-white text-black pt-6 pb-12 px-4 md:py-20 md:px-6 lg:px-20">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Left: the claim */}
                <div className="text-center md:text-left flex flex-col items-center md:items-start">
                    <div className="mb-2 md:mb-4 flex items-center gap-1 md:gap-2 justify-center md:justify-start">
                        <Image
                            src="/swiggly.svg"
                            alt=""
                            aria-hidden="true"
                            width={60}
                            height={60}
                            className="w-10 md:w-16 -rotate-12"
                        />
                        <p className="text-xs md:text-sm text-primary italic tracking-wide">
                            Connecting pets and parents across
                            <span className="font-bold"> Pakistan</span>
                        </p>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] mb-4">
                        <span className="block">Adopt a pet,</span>
                        <span className="block text-primary">or find one a home.</span>
                    </h1>

                    <p className="text-base md:text-lg text-gray-700 mb-6 max-w-xl leading-relaxed">
                        <span className="font-bold">Paltuu.pk</span> (also searched as{" "}
                        <span className="font-semibold text-gray-900">Paltu</span> or{" "}
                        <span className="font-semibold text-gray-900">Paaltuu</span>) is
                        Pakistan&apos;s pet adoption platform.{" "}
                        <span className="font-semibold text-gray-900">
                            We don&apos;t own or give away animals
                        </span>{" "}
                        — we connect people who have pets to rehome with people ready to
                        adopt. Plus a nationwide directory of{" "}
                        <Link
                            href="/pet-care"
                            className="text-black underline decoration-gray-400 hover:decoration-black font-medium"
                        >
                            vets near you
                        </Link>
                        .
                    </p>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <Link
                            href="/browse-pets"
                            className="inline-flex items-center justify-center gap-2 bg-primary text-white font-bold px-7 py-3.5 rounded-full text-base shadow-lg hover:scale-105 transition-transform duration-300 whitespace-nowrap"
                        >
                            Browse pets for adoption
                        </Link>
                        <Link
                            href="/create-listing"
                            className="inline-flex items-center justify-center gap-2 bg-white text-primary border-2 border-primary font-bold px-7 py-3.5 rounded-full text-base hover:bg-primary/5 transition-colors whitespace-nowrap"
                        >
                            List a pet for adoption
                        </Link>
                    </div>

                    <p className="mt-5 text-sm text-gray-600">
                        Looking for a vet?{" "}
                        <Link
                            href="/pet-care"
                            className="text-primary font-semibold underline decoration-primary/40 hover:decoration-primary inline-flex items-center gap-1"
                        >
                            Find clinics and doctors in your city
                            <ArrowRight size={14} aria-hidden="true" />
                        </Link>
                    </p>
                </div>

                {/* Right: the three things you can do. These cards ARE the explanation. */}
                {/* pt-12 on mobile reserves the strip the cat sits in — without it
                    she overlaps the "find a vet" line above. Desktop has room to
                    let her hang off the top edge. */}
                <div className="relative w-full pt-12 md:pt-0">
                    <div
                        className="pointer-events-none absolute top-0 right-2 w-24 h-24 md:-top-20 md:right-0 md:w-32 md:h-32 lg:-top-24 lg:-right-10 lg:w-44 lg:h-44 z-10"
                        aria-hidden="true"
                    >
                        <Image
                            src="/cat-on-box.png"
                            alt=""
                            width={176}
                            height={176}
                            className="object-contain"
                            priority
                        />
                    </div>

                    <ul className="relative z-0 flex flex-col gap-3">
                        {ACTIONS.map(({ icon: Icon, title, desc, href }) => (
                            <li key={href}>
                                <Link
                                    href={href}
                                    className="group flex items-start gap-4 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                                >
                                    <span className="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <Icon
                                            size={20}
                                            className="text-primary"
                                            aria-hidden="true"
                                        />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="flex items-center gap-1.5 font-bold text-gray-900">
                                            {title}
                                            <ArrowRight
                                                size={15}
                                                aria-hidden="true"
                                                className="text-primary opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300"
                                            />
                                        </span>
                                        <span className="block text-sm text-gray-600 mt-0.5 leading-relaxed">
                                            {desc}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}
