import Link from "next/link";
import Reveal from "./Reveal";

/**
 * The two sides of an adoption, shown side by side.
 *
 * Putting "I want to adopt" and "I want to rehome" in parallel columns is what
 * makes the word *platform* legible — it shows that both ends of the transaction
 * are ordinary people, and that Paltuu is the step in between rather than the
 * source of the animal.
 */

const ADOPT_STEPS = [
    {
        title: "Browse pets near you",
        desc: "Filter by city, species, breed and age. Every listing shows who is rehoming the pet: an owner, a shelter, or a rescue.",
    },
    {
        title: "Apply and connect",
        desc: "Send an adoption application and talk to the person or shelter directly. Ask your questions before you commit.",
    },
    {
        title: "Meet, and take them home",
        desc: "Arrange the handover between yourselves. Paltuu never holds the animal at any point.",
    },
];

const REHOME_STEPS = [
    {
        title: "List your pet, free",
        desc: "Photos, age, temperament, and why you're rehoming. Listings are reviewed before they go live.",
    },
    {
        title: "Review who applies",
        desc: "Applications come from real, verified accounts. You see them all and reply to the ones you want.",
    },
    {
        title: "Choose the family",
        desc: "The decision is entirely yours. You hand over your pet to the home you picked, not to us.",
    },
];

function Path({
    id,
    kicker,
    heading,
    steps,
    cta,
    href,
}: {
    id: string;
    kicker: string;
    heading: string;
    steps: { title: string; desc: string }[];
    cta: string;
    href: string;
}) {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-7 h-full flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wider text-primary mb-1">
                {kicker}
            </p>
            <h3 id={id} className="text-xl font-extrabold text-gray-900 mb-5">
                {heading}
            </h3>

            <ol className="space-y-4 flex-grow">
                {steps.map((step, i) => (
                    <li key={step.title} className="flex gap-4">
                        <span
                            aria-hidden="true"
                            className="shrink-0 w-7 h-7 rounded-full bg-primary text-white font-bold text-xs flex items-center justify-center"
                        >
                            {i + 1}
                        </span>
                        <div>
                            <h4 className="font-bold text-gray-900 mb-0.5">{step.title}</h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                        </div>
                    </li>
                ))}
            </ol>

            <Link
                href={href}
                className="mt-6 inline-flex items-center justify-center bg-primary text-white font-semibold text-sm px-6 py-3 rounded-full hover:opacity-90 transition-opacity"
            >
                {cta}
            </Link>
        </div>
    );
}

export default function AdoptionPathsSection() {
    return (
        <section
            className="bg-gray-50 px-6 lg:px-12 py-14 md:py-20"
            aria-labelledby="how-adoption-works"
        >
            <div className="max-w-6xl mx-auto">
                <div className="max-w-2xl mb-10">
                    <h2
                        id="how-adoption-works"
                        className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3"
                    >
                        How adoption works on Paltuu
                    </h2>
                    <p className="text-base text-gray-600 leading-relaxed">
                        Thousands of pet parents use Paltuu to browse{" "}
                        <Link
                            href="/adopt"
                            className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium"
                        >
                            pets available for adoption
                        </Link>{" "}
                        from shelters, rescues, and individual owners, and to read{" "}
                        <Link
                            href="/blogs"
                            className="text-primary underline decoration-primary/40 hover:decoration-primary font-medium"
                        >
                            pet care guides written for Pakistan
                        </Link>
                        . There are two ways in, so pick yours.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <Reveal delay={0} className="h-full">
                        <Path
                            id="path-adopt"
                            kicker="I want to adopt"
                            heading="Give a pet a home"
                            steps={ADOPT_STEPS}
                            cta="Browse pets for adoption"
                            href="/browse-pets"
                        />
                    </Reveal>
                    <Reveal delay={0.08} className="h-full">
                        <Path
                            id="path-rehome"
                            kicker="I need to rehome"
                            heading="Find your pet a home"
                            steps={REHOME_STEPS}
                            cta="List a pet for adoption"
                            href="/create-listing"
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}
