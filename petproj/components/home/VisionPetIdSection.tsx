import Link from "next/link";
import { Target, Eye, IdCard } from "lucide-react";
import PetIdCard from "@/components/PetIdCard";
import PetIdCardShowcase from "./PetIdCardShowcase";
import AppStoreBadges from "./AppStoreBadges";
import Reveal from "./Reveal";
import { PET_ID_CARD_SAMPLE } from "@/lib/homeContent";

/**
 * Why Paltuu exists, next to the most tangible expression of it.
 *
 * This merges two sections that used to sit a hundred lines apart saying
 * nearly the same thing — the "largest pet community" block and the separate
 * mission/vision cards. The priority order here is the founder's: homes first,
 * ecosystem second.
 */
export default function VisionPetIdSection() {
    return (
        <section
            className="py-16 md:py-20 px-6 lg:px-20 bg-gray-50"
            aria-labelledby="vision-heading"
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                <div>
                    <h2
                        id="vision-heading"
                        className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-5 leading-tight"
                    >
                        Every pet in Pakistan deserves a home
                        <span className="text-primary"> and an identity.</span>
                    </h2>

                    <div className="space-y-5 text-gray-600 leading-relaxed mb-8">
                        <div className="flex gap-4">
                            <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Target size={18} className="text-primary" aria-hidden="true" />
                            </span>
                            <p>
                                <span className="block font-bold text-gray-900 mb-1">
                                    Homes come first
                                </span>
                                Finding pets a home is the priority above everything else. Every
                                listing, every application, every adoption on this platform is
                                one animal off the street or out of a cage.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Eye size={18} className="text-primary" aria-hidden="true" />
                            </span>
                            <p>
                                <span className="block font-bold text-gray-900 mb-1">
                                    Then the whole ecosystem
                                </span>
                                The longer game is to build Pakistan&apos;s entire pet ecosystem —
                                adoption, vets, care, community — so that every dog, cat and
                                companion animal in the country is documented, cared for, and
                                never lost again.
                            </p>
                        </div>
                        <div className="flex gap-4">
                            <span className="shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <IdCard size={18} className="text-primary" aria-hidden="true" />
                            </span>
                            <p>
                                <span className="block font-bold text-gray-900 mb-1">
                                    Every pet gets an identity
                                </span>
                                A real Pet Identity Card, in the app. A name, a face, a number,
                                and a record that says this animal belongs to someone.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                        <Link
                            href="/browse-pets"
                            className="inline-flex items-center justify-center bg-primary text-white font-bold px-7 py-3 rounded-full hover:scale-105 transition-transform duration-300"
                        >
                            Meet the pets waiting →
                        </Link>
                    </div>

                    <AppStoreBadges className="mt-6" />
                </div>

                <div>
                    <PetIdCardShowcase>
                        <PetIdCard
                            name={PET_ID_CARD_SAMPLE.name}
                            parentName={PET_ID_CARD_SAMPLE.parentName}
                            gender={PET_ID_CARD_SAMPLE.gender}
                            identityNumber={PET_ID_CARD_SAMPLE.identityNumber}
                            dateOfBirth={PET_ID_CARD_SAMPLE.dateOfBirth}
                            dateOfIssue={PET_ID_CARD_SAMPLE.dateOfIssue}
                            dateOfExpiry={PET_ID_CARD_SAMPLE.dateOfExpiry}
                            photoUrl={PET_ID_CARD_SAMPLE.photoUrl}
                            photoAlt={PET_ID_CARD_SAMPLE.photoAlt}
                        />
                    </PetIdCardShowcase>
                    <p className="text-center text-sm text-gray-500 mt-5">
                        Lino&apos;s card — a real pet documented on Paltuu.
                    </p>
                </div>
            </div>
        </section>
    );
}
