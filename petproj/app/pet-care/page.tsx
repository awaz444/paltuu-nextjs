// PetCare Component
"use client";
import { useEffect, useState } from "react";
// import Navbar from "../../components/navbar";
// import VetFilterSection from "../../components/VetFilterSection";
import ClinicGrid from "../../components/ClinicGrid";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchClinics } from "../store/slices/clinicSlice";
import { MoonLoader } from "react-spinners";

export default function PetCare() {
    const dispatch = useDispatch<AppDispatch>();
    const { clinics, loading, error } = useSelector(
        (state: RootState) => state.clinics
    );

    const [primaryColor, setPrimaryColor] = useState("#000000"); // Default fallback color

    useEffect(() => {
        // Get the computed style of the `--primary-color` CSS variable
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) {
            setPrimaryColor(color);
        }
    }, []);

    useEffect(() => {
        // Dispatch fetchClinics when component mounts
        dispatch(fetchClinics());
    }, [dispatch]);

    return (
        <>
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}>
                {/* <VetFilterSection
                    onSearch={() => {}} 
                    onReset={() => {}}
                    onSearchAction={() => {}}
                /> */}
                <main className="flex min-h-screen flex-col mx-0 md:mx-8 mt-1 items-center pt-7 bg-gray-100">
                    <div className="w-full">
                        {loading ? (
                            <MoonLoader className="mt-5 mx-auto relative top-5" size={30} color={primaryColor} />
                        ) : error ? (
                            <p>Error: {error}</p>
                        ) : (
                            <ClinicGrid clinics={clinics} />
                        )}
                    </div>
                </main>
            </div>
        </>
    );
}

