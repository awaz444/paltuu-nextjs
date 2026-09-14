import Link from "next/link";
import PetIdCard from "@/components/PetIdCard";
import PetIdCardShowcase from "./PetIdCardShowcase";
import { PET_ID_CARD_SAMPLE } from "@/lib/homeContent";

/**
 * Why Paltuu exists, next to the most tangible expression of it.
 *
 * This merges two sections that used to sit a hundred lines apart saying
 * nearly the same thing: the "largest pet community" block and the separate
 * mission/vision cards. The priority order here is the founder's, homes first
 * and ecosystem second.
 */

const POINTS = [
    {
        title: "Homes come first",
        body: "Finding pets a home is the priority above everything else. Every listing, every application, every adoption on this platform is one animal off the street or out of a cage.",
    },
    {
        title: "Then the whole ecosystem",
        body: "The longer game is to build Pakistan's entire pet ecosystem, covering adoption, vets, care and community, so that every dog, cat and companion animal in the country is documented, cared for, and never lost again.",
    },
    {
        title: "Every pet gets an identity",
        body: "A real Pet Identity Card, in the app. A name, a face, a number, and a record that says this animal belongs to someone.",
    },
];

export default function VisionPetIdSection() {
    return (
        <section
            className="bg-gray-50 px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="vision-heading"
        >
            <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div>
                    <h2
                        id="vision-heading"
                        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 leading-tight"
                    >
                        Every pet in Pakistan deserves a home
                        <span className="text-primary"> and an identity.</span>
                    </h2>

                    <dl className="space-y-5 mb-7">
                        {POINTS.map((point) => (
                            <div
                                key={point.title}
                                className="border-l-2 border-primary/30 pl-4"
                            >
                                <dt className="font-bold text-gray-900 mb-1">{point.title}</dt>
                                <dd className="text-sm text-gray-600 leading-relaxed">
                                    {point.body}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    <Link
                        href="/browse-pets"
                        className="inline-flex items-center justify-center bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
                    >
                        Meet the pets waiting
                    </Link>
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
                    <p className="text-center text-sm text-gray-500 mt-4">
                        Lino&apos;s card, a real pet documented on Paltuu.
                    </p>
                </div>
            </div>
        </section>
    );
}
