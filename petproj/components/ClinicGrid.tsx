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
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <i className="bi bi-hospital text-4xl mb-4" />
                <p className="text-lg">No clinics found matching your criteria.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-4">
            {clinics.map((clinic) => (
                <div key={clinic.clinic_id} className="h-full">
                    <ClinicCard clinic={clinic} />
                </div>
            ))}
        </div>
    );
};

export default ClinicGrid;
