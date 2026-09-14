import Link from "next/link";
import { VET_CITIES } from "@/lib/vetCities";

/**
 * The page's internal-link hub into the /adopt/[...slug] tree.
 *
 * This is the most SEO-valuable block on the homepage and every href here is
 * indexed — do not "tidy" the anchors. The city columns are generated from
 * VET_CITIES so they can't drift from app/sitemap.ts, the footer and
 * /pet-care/[slug], which is the exact bug lib/vetCities.ts warns about.
 *
 * White background: this is the last section, and the footer below it is maroon
 * with a rounded top edge.
 */

function cityLinks(city: string) {
    const slug = city.toLowerCase();
    return [
        { href: `/adopt/${slug}`, label: `Pet Adoption ${city}` },
        { href: `/adopt/cats/${slug}`, label: `Cat ${city} / Cat Adoption` },
        { href: `/adopt/dogs/${slug}`, label: `Dog in ${city} / Dog Adoption` },
        { href: `/adopt/dogs/${slug}`, label: `Puppy Adoption in ${city}` },
        { href: `/adopt/cats/${slug}`, label: `Kitten Adoption in ${city}` },
        { href: `/pet-care/${slug}`, label: `Vets & Pet Care in ${city}` },
    ];
}

const NATIONWIDE = [
    { href: "/browse-pets", label: "Pet Adoption Pakistan" },
    { href: "/adopt/cats", label: "Cat in My City / Cat Pakistan" },
    { href: "/adopt/dogs", label: "Dog in My City / Dog Adoption" },
    { href: "/adopt/dogs", label: "Puppy in My City / Puppy Adoption" },
    { href: "/adopt/cats", label: "Kitten in My City / Kitten Adoption" },
    { href: "/pet-care", label: "Pakistan Pet App & Vets" },
    { href: "/lost-and-found", label: "Report a Lost or Found Pet" },
];

function Column({
    heading,
    links,
}: {
    heading: string;
    links: { href: string; label: string }[];
}) {
    return (
        <div>
            <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">
                {heading}
            </h3>
            <ul className="space-y-2">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link href={link.href} className="hover:text-primary hover:underline">
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function CityKeywordLinks() {
    return (
        <section
            className="bg-white px-6 lg:px-12 py-14 md:py-16"
            aria-labelledby="city-links-heading"
        >
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h2
                        id="city-links-heading"
                        className="text-xl md:text-2xl font-extrabold text-gray-900 mb-2"
                    >
                        Browse Pets &amp; Care Services in Your City
                    </h2>
                    <p className="text-sm text-gray-600 max-w-3xl">
                        Find dog, cat, puppy, and kitten adoption, along with professional pet
                        care services in Karachi, Lahore, Islamabad, and across Pakistan.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm text-gray-600">
                    {VET_CITIES.map((city) => (
                        <Column
                            key={city}
                            heading={`${city} Pet Services`}
                            links={cityLinks(city)}
                        />
                    ))}
                    <Column heading="Pakistan Pet Platform" links={NATIONWIDE} />
                </div>
            </div>
        </section>
    );
}
