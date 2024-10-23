"use client";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { RootState, AppDispatch } from "../store/store"; // Import store types
import { fetchCities } from "../store/slices/citiesSlice"; // Fetch cities from store
import { fetchPetCategories } from "../store/slices/petCategoriesSlice"; // Fetch pet categories from store

import Navbar from "@/components/navbar";

import "./styles.css";

export default function CreatePetListing() {

    const dispatch = useDispatch<AppDispatch>();
    const { cities } = useSelector((state: RootState) => state.cities); 
    const { categories } = useSelector((state: RootState) => state.categories); 

    return (
        <>
            <Navbar />
            <div
                className="fullBody"
                style={{ maxWidth: "90%", margin: "0 auto" }}></div>
        </>
    );
}
