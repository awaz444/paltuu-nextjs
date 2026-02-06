"use client";

import React from "react";
import { Clinic } from "../app/types/clinic";
import ClinicCard from "./ClinicCard";

interface ClinicGridProps {
    clinics: Clinic[];
}

const ClinicGrid: React.FC<ClinicGridProps> = ({ clinics }) => {
    if (!clinics || clinics.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 px-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-6">
                    <i className="bi bi-hospital text-3xl text-gray-400" />
                </div>

                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    No clinics found
                </h3>

                <p className="max-w-md text-gray-500">
                    We couldn’t find any clinics matching your criteria. Try adjusting
                    your filters or searching a different location.
                </p>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {clinics.map((clinic) => (
                    <div
                        key={clinic.clinic_id}
                        className="h-full transform transition-all duration-300 hover:-translate-y-1"
                    >
                        <ClinicCard clinic={clinic} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ClinicGrid;
