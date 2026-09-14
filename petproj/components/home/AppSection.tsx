import Image from "next/image";
import Link from "next/link";
import AppStoreBadges from "./AppStoreBadges";
import Reveal from "./Reveal";
import { APP_SCREENS } from "@/lib/homeContent";

/**
 * The app, high on the page because it is the part of Paltuu most visitors
 * don't know exists. The website is where adoption happens; the app is where
 * the community does.
 *
 * Screens are real crops from the store screenshots rather than mockups, so
 * what people see here is what they get after installing.
 */
export default function AppSection() {
    return (
        <section
            className="bg-primary px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="app-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-3xl mb-10 md:mb-12">
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70 mb-3">
                        The Paltuu app
                    </p>
                    <h2
                        id="app-heading"
                        className="text-2xl md:text-4xl font-extrabold text-white mb-4 leading-tight"
                    >
                        A social network where your pets have accounts too.
                    </h2>
                    <p className="text-base md:text-lg text-white/90 leading-relaxed">
                        Make your own profile, then make one for every pet you have. Post
                        photos, tag your pets, and let them build a following of their own.
                        It is how the pet community in Pakistan actually finds each other,
                        and it is where adoption, vets and Vets at Home all live in one
                        place.
                    </p>
                </div>

                <ul className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6 mb-10">
                    {APP_SCREENS.map((screen, i) => (
                        <Reveal key={screen.src} delay={i * 0.06}>
                            <li className="list-none">
                                <div className="rounded-[1.25rem] border-[5px] border-gray-900 bg-gray-900 overflow-hidden shadow-xl">
                                    <Image
                                        src={screen.src}
                                        alt={screen.alt}
                                        width={560}
                                        height={1036}
                                        className="block w-full h-auto"
                                        sizes="(max-width: 1024px) 45vw, 22vw"
                                    />
                                </div>
                                <h3 className="mt-4 text-sm md:text-base font-bold text-white">
                                    {screen.title}
                                </h3>
                                <p className="text-xs md:text-sm text-white/75 leading-relaxed mt-1">
                                    {screen.desc}
                                </p>
                            </li>
                        </Reveal>
                    ))}
                </ul>

                <div className="flex flex-col sm:flex-row sm:items-center gap-5 pt-8 border-t border-white/20">
                    <p className="text-base font-semibold text-white sm:max-w-xs">
                        Free to download. Free to use.
                    </p>
                    <AppStoreBadges className="sm:ml-auto" />
                </div>

                <p className="mt-5 text-sm text-white/75">
                    Prefer the browser?{" "}
                    <Link
                        href="/browse-pets"
                        className="font-semibold text-white underline decoration-white/40 hover:decoration-white"
                    >
                        Adoption works fully on the website
                    </Link>
                    .
                </p>
            </div>
        </section>
    );
}
