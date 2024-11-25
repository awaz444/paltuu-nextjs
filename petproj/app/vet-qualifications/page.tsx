"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../store/store"; // Adjust the import based on your store structure
import { postVetQualification } from "../store/slices/vetQualificationsSlice"; // Action to post qualification details
import { RootState } from "../store/store"; // Import RootState to access the Redux state
import { fetchQualifications } from "../store/slices/qualificationsSlice";
import Navbar from "../../components/Navbar";

const VetQualifications: React.FC = () => {
  const [selectedQualifications, setSelectedQualifications] = useState<number[]>([]);
  const [qualificationDetails, setQualificationDetails] = useState<{
    [key: number]: { yearAcquired: string; note: string };
  }>({});

  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch<AppDispatch>();

  const qualifications = useSelector(
    (state: RootState) => state.qualifications.qualifications
  );

  useEffect(() => {
    dispatch(fetchQualifications());
  }, [dispatch]);

  const vetId = searchParams.get("vet_id");
  if (!vetId) {
    console.error("Vet ID is missing.");
  }

  const handleDone = async () => {
    if (!selectedQualifications.length) {
      alert("Please select at least one qualification.");
      return;
    }

    if (vetId !== null) {
      const payload = selectedQualifications.map((qualificationId) => ({
        vet_id: vetId,
        qualification_id: qualificationId,
        year_acquired: qualificationDetails[qualificationId]?.yearAcquired || "",
        note: qualificationDetails[qualificationId]?.note || "",
      }));

      try {
        for (const qual of payload) {
          await dispatch(postVetQualification(qual));
        }
        alert("Qualifications added successfully!");
        setQualificationDetails({});
        setSelectedQualifications([]);
      } catch (error) {
        console.error("Error posting qualifications:", error);
      }
    }
  };

  const handleRedirect = () => {
    router.push(`/vet-specialization?vet_id=${vetId}`);
  };

  const handleCheckboxChange = (qualificationId: number) => {
    setSelectedQualifications((prevSelected) =>
      prevSelected.includes(qualificationId)
        ? prevSelected.filter((id) => id !== qualificationId)
        : [...prevSelected, qualificationId]
    );
  };

  const handleYearChange = (qualificationId: number, year: string) => {
    setQualificationDetails((prevDetails) => ({
      ...prevDetails,
      [qualificationId]: { ...prevDetails[qualificationId], yearAcquired: year },
    }));
  };

  const handleNoteChange = (qualificationId: number, note: string) => {
    setQualificationDetails((prevDetails) => ({
      ...prevDetails,
      [qualificationId]: { ...prevDetails[qualificationId], note },
    }));
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
      <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
        Add Qualifications
      </h2>
      {qualifications.length > 0 ? (
        qualifications.map((qualification) => (
          <div
            key={qualification.qualification_id}
            className="mb-6 p-4 border border-gray-300 rounded-lg"
          >
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                name="qualification"
                value={qualification.qualification_id}
                checked={selectedQualifications.includes(qualification.qualification_id)}
                onChange={() => handleCheckboxChange(qualification.qualification_id)}
                className="mr-2"
              />
              {qualification.qualification_name}
            </label>
            <div className="flex items-center mb-2">
              <label htmlFor={`year-${qualification.qualification_id}`} className="mr-2">
                Year Acquired:
              </label>
              <input
                type="text"
                id={`year-${qualification.qualification_id}`}
                value={qualificationDetails[qualification.qualification_id]?.yearAcquired || ""}
                onChange={(e) =>
                  handleYearChange(qualification.qualification_id, e.target.value)
                }
                placeholder="YYYY"
                className="w-24 p-2 border border-gray-300 rounded"
              />
            </div>
            <div className="flex flex-col mb-2">
              <label htmlFor={`note-${qualification.qualification_id}`} className="mb-1">
                Note (optional):
              </label>
              <textarea
                id={`note-${qualification.qualification_id}`}
                value={qualificationDetails[qualification.qualification_id]?.note || ""}
                onChange={(e) =>
                  handleNoteChange(qualification.qualification_id, e.target.value)
                }
                placeholder="Additional details..."
                className="p-2 border border-gray-300 rounded"
              />
            </div>
          </div>
        ))
      ) : (
        <p className="text-gray-500 text-center">No qualifications available.</p>
      )}
      <button
        type="button"
        onClick={handleDone}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Done
      </button>
      <button
        type="button"
        onClick={handleRedirect}
        className="w-full mt-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300"
      >
        Submit & Proceed to Add Category
      </button>
    </div>
  );
};

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-lg text-gray-500">Loading qualifications...</p>
  </div>
);

const VetQualificationsPage: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VetQualifications />
    </Suspense>
  );
};

export default VetQualificationsPage;
