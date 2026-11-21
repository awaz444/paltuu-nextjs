"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { fetchPetCategories } from "../../store/slices/petCategoriesSlice";

interface StepThreeProps {
  formData: any;
  setFormData: (data: any) => void;
  next: () => void;
  back: () => void;
}

const StepThree_Specializations: React.FC<StepThreeProps> = ({ formData, setFormData, next, back }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { categories, loading, error } = useSelector(
    (state: RootState) => state.categories
  );

  const [selectedCategories, setSelectedCategories] = useState<number[]>(
    formData.selectedCategories || []
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (categories.length === 0) {
      dispatch(fetchPetCategories());
    }
  }, [dispatch, categories]);

  const handleCheckboxChange = (categoryId: number) => {
    const newSelected = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    
    setSelectedCategories(newSelected);
    setFormData({ ...formData, selectedCategories: newSelected });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedCategories.length) {
      newErrors.specializations = "Please select at least one specialization";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      next();
    }
  };

  // Loading state with spinner
  if (loading) {
    return (
      <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
        <div className="flex justify-center items-center py-12">
          <p className="text-lg text-gray-500">Loading specializations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
        <div className="flex justify-center items-center py-12">
          <p className="text-lg text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Add Specializations</h2>
      <p className="text-gray-600 text-center mb-6">
        Select the pet categories you specialize in
      </p>

      {errors.specializations && (
        <p className="text-red-500 text-xs">{errors.specializations}</p>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {categories.map((category) => (
          <div
            key={category.category_id}
            className={`border rounded-xl p-4 transition-all duration-200 ${
              selectedCategories.includes(category.category_id)
                ? "border-primary bg-primary/5 shadow-sm"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.category_id)}
                onChange={() => handleCheckboxChange(category.category_id)}
                className="h-5 w-5 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {category.category_name}
                </span>
              </div>
            </label>
          </div>
        ))}
      </div>

      {selectedCategories.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3">
          <p className="text-sm text-green-700">
            <strong>{selectedCategories.length}</strong> specialization{selectedCategories.length > 1 ? 's' : ''} selected
          </p>
        </div>
      )}

      {errors.submit && (
        <div className="text-red-500 text-sm text-center">{errors.submit}</div>
      )}

      <div className="flex space-x-4 pt-4">
        <button
          type="button"
          onClick={back}
          className="flex-1 bg-gray-300 text-gray-700 py-3 px-4 rounded-xl font-semibold hover:bg-gray-400 transition-colors"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          disabled={selectedCategories.length === 0}
          className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepThree_Specializations;