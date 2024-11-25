"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store/store"; // Adjust the imports based on your store structure
import { fetchPetCategories } from "../store/slices/petCategoriesSlice"; // Action to fetch categories
import { postVetSpecialization } from "../store/slices/vetSpecializationSlice"; // Action to post specialization details
import Navbar from "../../components/navbar";

const VetSpecializationsForm: React.FC = () => {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const { categories } = useSelector((state: RootState) => state.categories); // Access categories from Redux store

  const vetId = searchParams.get("vet_id"); // Fetch vet_id from URL
  if (!vetId) {
    console.error("Vet ID is missing.");
  }

  useEffect(() => {
    // Fetch categories if not already loaded
    if (categories.length === 0) {
      dispatch(fetchPetCategories());
    }
  }, [dispatch, categories]);

  const handleCheckboxChange = (categoryId: number) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
  };

  const handleDone = async () => {
    if (!selectedCategories.length) {
      alert("Please select at least one specialization.");
      return;
    }

    if (vetId) {
      // Prepare payload for submission
      const payload = selectedCategories.map((categoryId) => ({
        vet_id: Number(vetId),
        category_id: categoryId,
      }));

      try {
        // Submit each specialization
        for (const specialization of payload) {
          await dispatch(postVetSpecialization(specialization));
        }
        alert("Specializations added successfully!");
        setSelectedCategories([]); // Clear selections after submission
        router.push(`/vet-schedule?vet_id=${vetId}`);
      } catch (error) {
        console.error("Error posting specializations:", error);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        Add Specializations
      </h2>
      {categories.length > 0 ? (
        categories.map((category) => (
          <div
            key={category.category_id}
            className="mb-4 p-4 border border-gray-300 rounded-lg"
          >
            <label className="flex items-center">
              <input
                type="checkbox"
                value={category.category_id}
                checked={selectedCategories.includes(category.category_id)}
                onChange={() => handleCheckboxChange(category.category_id)}
                className="mr-2"
              />
              {category.category_name}
            </label>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center">No categories available.</p>
      )}
      <button
        type="button"
        onClick={handleDone}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Done
      </button>
    </div>
  );
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-lg text-gray-500">Loading specializations...</p>
  </div>
);

const VetSpecializationsPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VetSpecializationsForm />
    </Suspense>
  );
};

export default VetSpecializationsPage;
