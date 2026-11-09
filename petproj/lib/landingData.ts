import { getRecentPets, type RecentPet } from "@/lib/recentPets";
import { getAllBlogsMetadata } from "@/lib/mdx";
import { queryClinics } from "@/lib/clinicsQuery";
import { isBuildPhase } from "@/lib/buildPhase";
import { VET_CITIES } from "@/lib/vetCities";
import type { BlogMetadata } from "@/lib/mdx-types";

/**
 * Data for the three landing pages (app/page.tsx, app/lp/karachi,
 * app/lp/international). All of it is read at build/ISR time, so the pages stay
 * static; the visitor's own location is only ever used client-side
 * (components/landing/NearestClinics.tsx).
 */

export interface LandingClinic {
    clinic_id: number;
    name: string;
    area: string;
    open24h: boolean;
}

export interface VetCityCount {
    city: string;
    count: number;
}

/** Short area for a card: the part of the address before the city. */
function shortArea(address: string | null, city: string): string {
    if (!address) return city;
    const parts = address
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p && !/^\d{5}$/.test(p) && !/pakistan/i.test(p) && p.toLowerCase() !== city.toLowerCase());
    return parts.slice(-2).join(", ") || city;
}

function isOpen24h(row: Record<string, unknown>): boolean {
    const hours = JSON.stringify(row.operating_hours ?? "");
    return /open 24 hours/i.test(hours);
}

export async function getLandingPets(limit = 3, city?: string): Promise<RecentPet[]> {
    if (!city) return getRecentPets(limit);
    // Ask for more and keep the city's own, so the Karachi page shows Karachi pets
    // when there are any, and falls back to the newest anywhere when there aren't.
    const pets = await getRecentPets(24);
    const local = pets.filter((p) => p.city.toLowerCase() === city.toLowerCase());
    return (local.length >= limit ? local : [...local, ...pets.filter((p) => !local.includes(p))]).slice(0, limit);
}

export function getLandingPosts(limit = 3): BlogMetadata[] {
    return getAllBlogsMetadata().slice(0, limit);
}

/** Top clinics in a city, ranked the way /pet-care ranks them (verified, then rating). */
export async function getTopClinics(city: string, limit = 3): Promise<LandingClinic[]> {
    try {
        const { data } = await queryClinics({ city, limit, listingType: "clinic" });
        return data.map((row) => ({
            clinic_id: row.clinic_id,
            name: row.name,
            area: shortArea(row.address, city),
            open24h: isOpen24h(row),
        }));
    } catch (error) {
        console.error("getTopClinics failed:", error);
        if (isBuildPhase()) return [];
        throw error;
    }
}

/** Live clinic counts for the "Vets in <city>" tiles. */
export async function getVetCityCounts(): Promise<VetCityCount[]> {
    try {
        return await Promise.all(
            VET_CITIES.map(async (city) => {
                const { pagination } = await queryClinics({ city, limit: 1 });
                return { city, count: pagination.total };
            })
        );
    } catch (error) {
        console.error("getVetCityCounts failed:", error);
        if (isBuildPhase()) return VET_CITIES.map((city) => ({ city, count: 0 }));
        throw error;
    }
}
