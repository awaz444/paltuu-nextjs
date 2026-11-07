"use client";

import React from "react";
import { Clinic } from "../app/types/clinic";
import ClinicCard from "./ClinicCard";
import { haversineDistanceKm } from "@/lib/geo";

interface ClinicGridProps {
    clinics: Clinic[];
    listingType?: "all" | "clinic" | "home_vet";
    /** When set, each card with coordinates shows its distance from here. */
    distanceFrom?: { lat: number; lng: number } | null;
}

const distanceOf = (clinic: Clinic, from: { lat: number; lng: number }): number | null => {
    // pg returns numeric columns as strings, so coerce before checking.
    if (clinic.latitude == null || clinic.longitude == null) return null;
    const lat = Number(clinic.latitude);
    const lng = Number(clinic.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return haversineDistanceKm(from.lat, from.lng, lat, lng);
};

const ClinicGrid: React.FC<ClinicGridProps> = ({ clinics, listingType = "all", distanceFrom = null }) => {
    const isHomeVet = listingType === "home_vet";

    if (!clinics || clinics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-6">
                    <i className="bi bi-hospital text-3xl text-gray-400" />
                </div>

                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    {isHomeVet ? "No home vets found" : listingType === "clinic" ? "No clinics found" : "No listings found"}
                </h3>

                <p className="max-w-md text-gray-500">
                    {isHomeVet
                        ? "We couldn’t find any home vets matching your criteria. Try a different city or area."
                        : listingType === "clinic"
                        ? "We couldn’t find any clinics matching your criteria. Try adjusting your filters or searching a different location."
                        : "We couldn’t find any clinics or home vets matching your criteria. Try adjusting your filters or searching a different location."}
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Same grid as Browse Pets */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                {clinics.map((clinic) => (
                    <ClinicCard
                        key={clinic.clinic_id}
                        clinic={clinic}
                        distanceKm={distanceFrom ? distanceOf(clinic, distanceFrom) : null}
                    />
                ))}
            </div>
        </div>
    );
};

export default ClinicGrid;
