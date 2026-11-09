import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { LandingClinic, VetCityCount } from "@/lib/landingData";
import NearestClinics from "./NearestClinics";

/**
 * Vets near you. Two shapes:
 * - `clinics` (Karachi page): the city's top three clinics, swapped for the
 *   nearest five when the visitor shares their location.
 * - `cities` (Pakistan page): the most-visited vet pages, one per city.
 * `children` sits underneath (the Pakistan page's Karachi-only Vets at Home card).
 */

export default function VetsNearYou({
    subtitle,
    clinics,
    cities,
    city,
    children,
}: {
    subtitle: string;
    clinics?: LandingClinic[];
    cities?: VetCityCount[];
    /** The city whose "All vets in …" link leads; omit to link /pet-care. */
    city?: string;
    children?: ReactNode;
}) {
    const initial = clinics ? (
        <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {clinics.map((c) => (
                <li key={c.clinic_id}>
                    <Link
                        href={`/pet-care/clinic/${c.clinic_id}`}
                        className="flex h-full items-start gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-primary"
                    >
                        <Image src="/icons/features/vet.jpg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-sm font-bold text-gray-900">{c.name}</span>
                            <span className="line-clamp-1 text-xs text-gray-600">{c.area}</span>
                            {c.open24h && <span className="text-xs font-semibold text-primary">Open 24 hours</span>}
                        </span>
                    </Link>
                </li>
            ))}
        </ul>
    ) : (
        <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-3">
            {(cities ?? []).map((c) => (
                <li key={c.city}>
                    <Link
                        href={`/pet-care/${c.city.toLowerCase()}`}
                        className="flex h-full items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3.5 transition-colors hover:border-primary"
                    >
                        <Image src="/icons/features/vet.jpg" alt="" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
                        <span className="flex flex-1 flex-col gap-0.5">
                            <span className="font-bold text-gray-900">Vets in {c.city}</span>
                            {c.count > 0 && <span className="text-xs text-gray-600">{c.count} verified clinics</span>}
                        </span>
                        <span aria-hidden="true" className="font-semibold text-primary">→</span>
                    </Link>
                </li>
            ))}
        </ul>
    );

    return (
        <section aria-labelledby="vets-heading" className="bg-white px-5 py-12 md:py-20">
            <div className="mx-auto max-w-6xl">
                <h2 id="vets-heading" className="text-xl font-semibold text-gray-900 md:text-[28px]">
                    Vets near you
                </h2>
                <p className="mb-4 mt-1.5 text-sm text-gray-600">{subtitle}</p>

                <NearestClinics initial={initial} label={clinics ? "Use my location" : "Show the 5 nearest"} />

                <div className="mt-5 flex flex-wrap items-center gap-2">
                    <Link
                        href={city ? `/pet-care/${city.toLowerCase()}` : "/pet-care"}
                        className="mr-2 text-sm font-semibold text-primary hover:underline"
                    >
                        {city ? `All vets in ${city}` : "All vets and clinics"} →
                    </Link>
                    {clinics &&
                        ["Lahore", "Islamabad"].map((c) => (
                            <Link
                                key={c}
                                href={`/pet-care/${c.toLowerCase()}`}
                                className="rounded-full border border-gray-200 px-3 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary"
                            >
                                Vets in {c}
                            </Link>
                        ))}
                </div>

                {children}
            </div>
        </section>
    );
}
