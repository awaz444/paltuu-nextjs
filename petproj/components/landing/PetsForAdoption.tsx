import Link from "next/link";
import { formatAge } from "@/utils/formatAge";
import type { RecentPet } from "@/lib/recentPets";

/**
 * Three recent listings plus "Add Your Pet", in the Browse Pets card style
 * (components/petGrid.tsx): white rounded-3xl cards, square rounded-2xl photo,
 * bold name with PET#, age, and a pin with the city. Two columns on a phone,
 * four from md up.
 */

interface Chip {
    label: string;
    href: string;
}

export default function PetsForAdoption({
    pets,
    title,
    subtitle,
    tone = "primary",
    chips = [],
    countrySuffix = "",
}: {
    pets: RecentPet[];
    title: string;
    subtitle: string;
    tone?: "primary" | "white";
    chips?: Chip[];
    /** Appended to each city, e.g. ", Pakistan" on paltuu.org. */
    countrySuffix?: string;
}) {
    if (pets.length === 0) return null;
    const onPrimary = tone === "primary";

    return (
        <section aria-labelledby="pets-heading" className={`${onPrimary ? "bg-primary" : "bg-white"} px-5 py-12 md:py-20`}>
            <div className="mx-auto max-w-6xl">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                    <div>
                        <h2 id="pets-heading" className={`text-xl font-semibold md:text-[28px] ${onPrimary ? "text-white" : "text-gray-900"}`}>
                            {title}
                        </h2>
                        <p className={`mt-1.5 text-sm ${onPrimary ? "text-white/85" : "text-gray-600"}`}>{subtitle}</p>
                    </div>
                    <Link
                        href="/browse-pets"
                        aria-label="Browse all pets available for adoption"
                        className={`text-sm font-semibold hover:underline ${onPrimary ? "text-white" : "text-primary"}`}
                    >
                        All pets for adoption →
                    </Link>
                </div>

                <div className="grid grid-cols-2 gap-3.5 md:grid-cols-4">
                    <Link
                        href="/create-listing"
                        data-cta="home_pets_add_your_pet"
                        className={`flex min-h-[240px] flex-col items-center justify-center gap-2.5 rounded-3xl p-3 text-center transition-all duration-300 hover:scale-102 ${
                            onPrimary ? "bg-white" : "bg-gray-100"
                        } border-2 border-transparent hover:border-primary`}
                    >
                        <span aria-hidden="true" className="flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-primary text-primary">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </span>
                        <span className="text-sm font-semibold text-primary">Add Your Pet</span>
                        <span className="text-xs leading-snug text-gray-600">Free. You choose who adopts.</span>
                    </Link>

                    {pets.map((pet) => (
                        <Link
                            key={pet.pet_id}
                            href={`/browse-pets/${pet.pet_id}`}
                            className="flex flex-col rounded-3xl border-2 border-transparent bg-white p-3 shadow-sm transition-all duration-300 hover:scale-102 hover:border-primary"
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={pet.image_url || "/dog-placeholder.png"}
                                alt={`${pet.pet_name}${pet.pet_breed ? ` – ${pet.pet_breed}` : ""} available for adoption in ${pet.city}${countrySuffix}`}
                                className="mb-2.5 aspect-square w-full rounded-2xl bg-gray-200 object-cover"
                                loading="lazy"
                            />
                            <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate font-bold text-gray-900">{pet.pet_name}</span>
                                <span className="shrink-0 font-mono text-[10px] font-semibold text-gray-400">PET#{pet.pet_id}</span>
                            </span>
                            <span className="mt-0.5 truncate text-sm text-gray-600">{formatAge(pet.age_months)}</span>
                            <span className="mt-0.5 flex items-center gap-1.5 truncate text-sm text-gray-600">
                                <svg aria-hidden="true" className="shrink-0 text-primary" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
                                    <circle cx="12" cy="9.5" r="2.5" />
                                </svg>
                                {pet.city}
                                {countrySuffix}
                            </span>
                        </Link>
                    ))}
                </div>

                {chips.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                        {chips.map((c) => (
                            <Link
                                key={c.label}
                                href={c.href}
                                className={`rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors ${
                                    onPrimary
                                        ? "border border-white/50 text-white hover:bg-white/10"
                                        : "border border-gray-200 bg-white text-gray-700 hover:border-primary hover:text-primary"
                                }`}
                            >
                                {c.label}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
