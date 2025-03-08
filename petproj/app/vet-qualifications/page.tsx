"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store/store";
import { fetchQualifications } from "../store/slices/qualificationsSlice"; // Adjust import path as needed
import { postVetQualification } from "../store/slices/vetQualificationsSlice";
import { useRouter, useSearchParams } from "next/navigation";

const VetQualificationsForm = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const vetId = searchParams.get("vet_id");

  const { qualifications, loading, error } = useSelector(
    (state: RootState) => state.qualifications
  );

  const [selectedQualifications, setSelectedQualifications] = useState<number[]>([]);
  const [qualificationDetails, setQualificationDetails] = useState<{
    [key: number]: { yearAcquired: string; note: string };
  }>({});

  useEffect(() => {
    // Dispatch fetch action on component mount to load qualifications
    dispatch(fetchQualifications());
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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
        setQualificationDetails({});
        setSelectedQualifications([]);
        router.push(`/vet-specialization?vet_id=${vetId}`);
      } catch (error) {
        console.error("Error posting qualifications:", error);
      }
    }
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

  if (loading) return <div>Loading qualifications...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section (Logo) - Unchanged */}
      <div className="lg:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-b-3xl lg:rounded-r-3xl lg:rounded-b-none">
        <img
          src="/paltu_logo.svg"
          alt="Paltu Logo"
          className="mb-6 w-40 lg:w-full max-w-full"
        />
      </div>

      {/* Right Section (Form) */}
      <div className="lg:w-1/2 bg-gray-100 flex items-center justify-center px-4 py-8 lg:px-8 lg:py-12">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4"
        >
          <h2 className="text-3xl font-semibold text-center mb-2">
            Add Qualifications
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Select the qualifications for the vet and provide additional details.
          </p>
          <p className="text-red-600 text-center mb-6">
            Disclaimer: You will be asked to prove these qualifications later. Please select only the qualifications you can provide proof for.
          </p>

          {/* Qualifications List */}
          {qualifications.length > 0 ? (
            qualifications.map((qualification) => (
              <div
                key={qualification.qualification_id}
                className="mb-6 p-4 border border-gray-300 rounded-lg"
              >
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    value={qualification.qualification_id}
                    checked={selectedQualifications.includes(qualification.qualification_id)}
                    onChange={() => handleCheckboxChange(qualification.qualification_id)}
                    className="mr-2"
                  />
                  {qualification.qualification_name}
                </label>
                <div className="flex items-center mb-2">
                  <label
                    htmlFor={`year-${qualification.qualification_id}`}
                    className="mr-2"
                  >
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
                  <label
                    htmlFor={`note-${qualification.qualification_id}`}
                    className="mb-1"
                  >
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

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 px-4 rounded-xl hover:bg-primary-dark transition"
          >
            Submit & Proceed to Add Specializations
          </button>
        </form>
      </div>
    </div>
  );
};

const VetQualifications = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <VetQualificationsForm />
  </Suspense>
);

export default VetQualifications;
