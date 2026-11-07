/**
 * Great-circle distance in km. Earth radius 6371 km matches the SQL haversine
 * in lib/clinicsQuery.ts and the app's src/utils/geo.ts, so the km shown on a
 * card agrees with the order the backend sorted by.
 */
export function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** "850 m" under 1 km, "4.2 km" under 10 km, "23 km" beyond. */
export function formatDistanceKm(km: number): string {
    if (km < 1) return `${Math.max(50, Math.round((km * 1000) / 50) * 50)} m`;
    if (km < 10) return `${km.toFixed(1)} km`;
    return `${Math.round(km)} km`;
}
