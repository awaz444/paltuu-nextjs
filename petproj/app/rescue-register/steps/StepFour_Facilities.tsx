"use client";
import React, { useState, useEffect } from "react";
import { Input, Checkbox, Spin } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { fetchPetCategories } from "../../store/slices/petCategoriesSlice";
import { MoonLoader } from "react-spinners";

interface PetCategory {
    category_id: number;
    category_name: string;
    emoji?: string;
}

interface StepFourProps {
    data: {
        animalTypes: number[];
        capacity: number;
    };
    setData: (updatedData: Partial<StepFourProps['data']>) => void;
    next: () => void;
    back: () => void;
    isSubmitting: boolean;
}

const RescueStepFour: React.FC<StepFourProps> = ({
    data,
    setData,
    next,
    back,
    isSubmitting
}) => {
    const dispatch = useDispatch<AppDispatch>();
    const { categories, loading, error } = useSelector((state: RootState) => state.categories);
    const [capacityInput, setCapacityInput] = useState<string>(data.capacity?.toString() || '');
    const [primaryColor, setPrimaryColor] = useState("#A00000");

    useEffect(() => {
        const rootStyles = getComputedStyle(document.documentElement);
        const color = rootStyles.getPropertyValue("--primary-color").trim();
        if (color) setPrimaryColor(color);

        dispatch(fetchPetCategories());
    }, [dispatch]);

    const handleAnimalTypeChange = (checkedValues: number[]) => {
        setData({ animalTypes: checkedValues });
    };

    const handleCapacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setCapacityInput(value);
        if (/^\d*$/.test(value)) {
            setData({ capacity: value ? parseInt(value) : 0 });
        }
    };

    if (loading) {
        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 flex justify-center items-center h-64">
                <MoonLoader size={30} color={primaryColor} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 text-center py-8">
                <p className="text-red-500">Error loading pet categories: {error}</p>
                <button 
                    onClick={() => dispatch(fetchPetCategories())} 
                    className="mt-4 bg-primary text-white font-semibold py-2 px-4 rounded-xl"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-5">
            <h2 className="text-2xl font-semibold text-center">Facilities</h2>
            <p className="text-gray-600 text-center mb-4">
                Tell us about your shelter's capacity and animal types
            </p>

            {/* Animal Types */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">
                    Animal Types You Rescue
                </label>
                <Checkbox.Group
                    value={data.animalTypes}
                    onChange={handleAnimalTypeChange}
                    className="grid grid-cols-2 gap-2"
                >
                    {categories.map((category: PetCategory) => (
                        <Checkbox 
                            key={category.category_id} 
                            value={category.category_id}
                            className="flex items-center"
                        >
                            {category.emoji && <span className="mr-2">{category.emoji}</span>}
                            {category.category_name}
                        </Checkbox>
                    ))}
                </Checkbox.Group>
            </div>

            {/* Capacity */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Approximate Capacity
                </label>
                <Input
                    type="text"
                    value={capacityInput}
                    onChange={handleCapacityChange}
                    placeholder="e.g. 30"
                    suffix="animals"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                    Example: "We can house up to 30 animals"
                </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={back}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={next}
                    disabled={data.animalTypes.length === 0 || !data.capacity || isSubmitting}
                    className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
                        data.animalTypes.length === 0 || !data.capacity || isSubmitting
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                    }`}
                >
                    {isSubmitting ? "Submitting..." : "Complete Registration"}
                </button>
            </div>
        </div>
    );
};

export default RescueStepFour;