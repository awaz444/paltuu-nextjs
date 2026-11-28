/**
 * Visitor geography for the admin traffic dashboard (PALTU-192).
 *
 * Province comes from Vercel's IP geolocation (x-vercel-ip-country-region), so
 * it is approximate and wrong behind a VPN, like the city. The Karachi area is
 * only known when a visitor shares their browser location, and is the nearest
 * of the neighbourhoods below: good enough to see which parts of the city we
 * reach, not an address.
 */

// ISO 3166-2:PK subdivision codes, as Vercel sends them (without the "PK-").
const PK_PROVINCES: Record<string, string> = {
    SD: "Sindh",
    PB: "Punjab",
    KP: "Khyber Pakhtunkhwa",
    BA: "Balochistan",
    IS: "Islamabad",
    GB: "Gilgit-Baltistan",
    JK: "Azad Kashmir",
};

export function regionName(country: string | null, code: string | null): string | null {
    if (!code) return null;
    const c = code.trim().toUpperCase().slice(0, 100);
    if (!c) return null;
    return country === "PK" ? PK_PROVINCES[c] ?? c : c;
}

type District = "South" | "East" | "Central" | "West" | "Keamari" | "Korangi" | "Malir";

// Rough centre of each neighbourhood. A point is given the nearest one.
const KARACHI_AREAS: { area: string; district: District; lat: number; lng: number }[] = [
    { area: "Clifton", district: "South", lat: 24.8138, lng: 67.03 },
    { area: "DHA", district: "South", lat: 24.795, lng: 67.065 },
    { area: "Saddar", district: "South", lat: 24.8556, lng: 67.0275 },
    { area: "Lyari", district: "South", lat: 24.865, lng: 66.996 },
    { area: "Garden", district: "South", lat: 24.877, lng: 67.015 },
    { area: "PECHS & Tariq Road", district: "East", lat: 24.871, lng: 67.059 },
    { area: "Bahadurabad", district: "East", lat: 24.882, lng: 67.07 },
    { area: "Gulshan-e-Iqbal", district: "East", lat: 24.918, lng: 67.097 },
    { area: "Gulistan-e-Johar", district: "East", lat: 24.918, lng: 67.13 },
    { area: "Scheme 33", district: "East", lat: 24.95, lng: 67.135 },
    { area: "Nazimabad", district: "Central", lat: 24.91, lng: 67.03 },
    { area: "North Nazimabad", district: "Central", lat: 24.942, lng: 67.04 },
    { area: "Liaquatabad", district: "Central", lat: 24.905, lng: 67.045 },
    { area: "Gulberg & FB Area", district: "Central", lat: 24.93, lng: 67.07 },
    { area: "North Karachi", district: "Central", lat: 24.975, lng: 67.055 },
    { area: "New Karachi", district: "Central", lat: 24.99, lng: 67.065 },
    { area: "Orangi", district: "West", lat: 24.95, lng: 66.99 },
    { area: "Manghopir", district: "West", lat: 24.99, lng: 67.01 },
    { area: "SITE", district: "Keamari", lat: 24.905, lng: 66.995 },
    { area: "Baldia", district: "Keamari", lat: 24.92, lng: 66.96 },
    { area: "Keamari & Manora", district: "Keamari", lat: 24.83, lng: 66.98 },
    { area: "Mauripur & Hawke's Bay", district: "Keamari", lat: 24.88, lng: 66.92 },
    { area: "Korangi", district: "Korangi", lat: 24.83, lng: 67.13 },
    { area: "Landhi", district: "Korangi", lat: 24.85, lng: 67.2 },
    { area: "Shah Faisal", district: "Korangi", lat: 24.875, lng: 67.16 },
    { area: "Malir", district: "Malir", lat: 24.893, lng: 67.2 },
    { area: "Malir Cantt", district: "Malir", lat: 24.95, lng: 67.2 },
    { area: "Bahria Town", district: "Malir", lat: 25.0, lng: 67.31 },
    { area: "Bin Qasim", district: "Malir", lat: 24.82, lng: 67.35 },
    { area: "Gadap", district: "Malir", lat: 25.06, lng: 67.15 },
];

// Karachi division, generously. Points outside are not counted as Karachi.
const KARACHI_BOUNDS = { minLat: 24.7, maxLat: 25.35, minLng: 66.6, maxLng: 67.65 };

export function karachiArea(lat: number, lng: number): { area: string; district: District } | null {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const b = KARACHI_BOUNDS;
    if (lat < b.minLat || lat > b.maxLat || lng < b.minLng || lng > b.maxLng) return null;
    // At this latitude a degree of longitude is ~0.91 of a degree of latitude.
    let best = KARACHI_AREAS[0];
    let bestD = Infinity;
    for (const a of KARACHI_AREAS) {
        const d = (a.lat - lat) ** 2 + ((a.lng - lng) * 0.91) ** 2;
        if (d < bestD) {
            bestD = d;
            best = a;
        }
    }
    return { area: best.area, district: best.district };
}
