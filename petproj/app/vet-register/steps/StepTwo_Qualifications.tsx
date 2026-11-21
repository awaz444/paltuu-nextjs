"use client";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../../store/store";
import { fetchQualifications } from "../../store/slices/qualificationsSlice";

interface StepTwoProps {
  formData: any;
  setFormData: (data: any) => void;
  next: () => void;
  back: () => void;
}

const StepTwo_Qualifications: React.FC<StepTwoProps> = ({ formData, setFormData, next, back }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { qualifications, loading, error } = useSelector(
    (state: RootState) => state.qualifications
  );

  const [selectedQualifications, setSelectedQualifications] = useState<number[]>(
    formData.selectedQualifications || []
  );
  const [qualificationDetails, setQualificationDetails] = useState<{
    [key: number]: { yearAcquired: string; note: string };
  }>(formData.qualificationDetails || {});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    dispatch(fetchQualifications());
  }, [dispatch]);

  const handleCheckboxChange = (qualificationId: number) => {
    const newSelected = selectedQualifications.includes(qualificationId)
      ? selectedQualifications.filter((id) => id !== qualificationId)
      : [...selectedQualifications, qualificationId];
    
    setSelectedQualifications(newSelected);
    setFormData({ 
      ...formData, 
      selectedQualifications: newSelected,
      qualificationDetails 
    });
  };

  const handleYearChange = (qualificationId: number, year: string) => {
    const newDetails = {
      ...qualificationDetails,
      [qualificationId]: { ...qualificationDetails[qualificationId], yearAcquired: year },
    };
    setQualificationDetails(newDetails);
    setFormData({ 
      ...formData, 
      selectedQualifications,
      qualificationDetails: newDetails 
    });
  };

  const handleNoteChange = (qualificationId: number, note: string) => {
    const newDetails = {
      ...qualificationDetails,
      [qualificationId]: { ...qualificationDetails[qualificationId], note },
    };
    setQualificationDetails(newDetails);
    setFormData({ 
      ...formData, 
      selectedQualifications,
      qualificationDetails: newDetails 
    });
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!selectedQualifications.length) {
      newErrors.qualifications = "Please select at least one qualification";
    }

    // Check if year is provided for selected qualifications
    selectedQualifications.forEach(qualId => {
      if (!qualificationDetails[qualId]?.yearAcquired) {
        newErrors[`year_${qualId}`] = "Year acquired is required";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      next();
    }
  };

  if (loading) {
    return (
      <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
        <div className="flex justify-center items-center py-12">
          <p className="text-lg text-gray-500">Loading qualifications...</p>
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
      <h2 className="text-2xl font-semibold text-center">Add Your Qualifications</h2>
      <p className="text-gray-600 text-center mb-6">
        Select your veterinary qualifications and certifications
      </p>

      {errors.qualifications && (
        <p className="text-red-500 text-xs">{errors.qualifications}</p>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {qualifications.map((qualification) => (
          <div
            key={qualification.qualification_id}
            className={`border rounded-xl p-4 ${
              selectedQualifications.includes(qualification.qualification_id)
                ? "border-primary bg-primary/5"
                : "border-gray-300"
            }`}
          >
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={selectedQualifications.includes(qualification.qualification_id)}
                onChange={() => handleCheckboxChange(qualification.qualification_id)}
                className="mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-900">
                  {qualification.qualification_name}
                </span>
                {qualification.description && (
                  <p className="text-xs text-gray-600 mt-1">
                    {qualification.description}
                  </p>
                )}
              </div>
            </label>

            {selectedQualifications.includes(qualification.qualification_id) && (
              <div className="mt-3 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Year Acquired *
                  </label>
                  <input
                    type="number"
                    min="1950"
                    max={new Date().getFullYear()}
                    value={qualificationDetails[qualification.qualification_id]?.yearAcquired || ""}
                    onChange={(e) => handleYearChange(qualification.qualification_id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    placeholder="e.g., 2020"
                  />
                  {errors[`year_${qualification.qualification_id}`] && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors[`year_${qualification.qualification_id}`]}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={qualificationDetails[qualification.qualification_id]?.note || ""}
                    onChange={(e) => handleNoteChange(qualification.qualification_id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                    placeholder="Any additional information about this qualification"
                    rows={2}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

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
          className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default StepTwo_Qualifications;