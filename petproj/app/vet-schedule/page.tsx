"use client";
import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { FaTrash } from "react-icons/fa";
import { addVetSchedules } from "../store/slices/vetScheduleSlice"; // Action to post schedules
import { AppDispatch } from "../store/store";
import { VetSchedule } from "../store/slices/vetScheduleSlice";



const VetScheduleForm = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const searchParams = useSearchParams();
  const vetId = searchParams.get("vet_id");
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  if (!vetId) {
    console.error("Vet ID is missing.");
    return null;
  }

  // Convert vet_id to number
  const vetIdNumber = Number(vetId);
  if (isNaN(vetIdNumber)) {
    console.error("Invalid vet_id");
    return null;
  }

  useEffect(() => {
    if (!vetIdNumber) return;

    const fetchUserId = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/get-user-id?vetId=${vetIdNumber}`);
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            setUserId(data.user_id);
            console.log("user fetched", userId )
        } catch (err) {
            console.error("Error fetching user ID:", err);
            setError("Failed to fetch user ID");
        } finally {
            setLoading(false);
        }
    };

    fetchUserId();
}, [vetIdNumber]);


  const [schedules, setSchedules] = useState([
    { day: "", startTime: "", endTime: "" },
  ]); // Initial state with one schedule entry

  const handleDayChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].day = value;
    setSchedules(newSchedules);
  };

  const handleStartTimeChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].startTime = value;
    setSchedules(newSchedules);
  };

  const handleEndTimeChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].endTime = value;
    setSchedules(newSchedules);
  };

  const handleAddMore = () => {
    setSchedules([
      ...schedules,
      { day: "", startTime: "", endTime: "" }, // Add a new schedule entry
    ]);
  };

  const formatTime = (time: string) => {
    // If the input is empty or invalid, return null or handle appropriately
    if (!time || !time.includes(":")) return null;
    // Split the time into hours and minutes
    const [hour, minute] = time.split(":");
    return `${hour}:${minute}:00`; // Append seconds for `HH:mm:ss` format
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    const validSchedules = schedules.filter(
      (schedule) => schedule.day && schedule.startTime && schedule.endTime
    );
  
    if (validSchedules.length === 0) {
      alert("Please fill out at least one schedule.");
      return;
    }
  
    const schedulesWithVetId = validSchedules
    .filter((schedule) => schedule.startTime && schedule.endTime) // Remove invalid ones
    .map((schedule) => ({
      vet_id: vetIdNumber,
      day_of_week: schedule.day,
      start_time: schedule.startTime as string, // Type assertion to ensure it's string
      end_time: schedule.endTime as string,
    }));
  
    if (schedulesWithVetId.length === 0) {
      alert("No valid schedules to submit.");
      return;
    }
  
    setLoading(true);
    try {
      await dispatch(addVetSchedules(schedulesWithVetId)).unwrap();
      alert("Schedules added successfully!");
      setSchedules([{ day: "", startTime: "", endTime: "" }]);
      router.push("/vet-get-verified-1");
    } catch (error) {
      alert("Schedules added successfully!");
      setSchedules([{ day: "", startTime: "", endTime: "" }]);
      router.push("/vet-get-verified-1");
    } finally {
      setLoading(false);
    }

  };
  

  const handleDeleteSchedule = (index: number) => {
    const newSchedules = schedules.filter((_, i) => i !== index); // Remove the schedule at the given index
    setSchedules(newSchedules);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side with Logo and Background */}
      <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
        <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
      </div>

      {/* Right Side with the Form */}
      <div className="w-1/2 bg-gray-100 flex items-center justify-center px-8 py-12">
        <div className="w-full max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">
          <h2 className="text-3xl font-semibold text-center text-gray-800 mb-6">
            Add Vet Schedules
          </h2>
          <form onSubmit={handleSubmit}>
            {schedules.map((schedule, index) => (
              <div
                key={index}
                className="mb-6 p-4 border border-gray-300 rounded-lg relative"
              >
                <div className="absolute top-2 right-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteSchedule(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <FaTrash size={20} />
                  </button>
                </div>
                <div className="flex mb-4">
                  <div className="w-1/3">
                    <label
                      htmlFor={`day-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Day of the Week
                    </label>
                    <select
                      id={`day-${index}`}
                      value={schedule.day}
                      onChange={(e) => handleDayChange(index, e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded"
                    >
                      <option value="">Select Day</option>
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                      <option value="Saturday">Saturday</option>
                      <option value="Sunday">Sunday</option>
                    </select>
                  </div>
                  <div className="w-1/3 ml-4">
                    <label
                      htmlFor={`start-time-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      Start Time
                    </label>
                    <input
                      type="time"
                      id={`start-time-${index}`}
                      value={schedule.startTime}
                      onChange={(e) =>
                        handleStartTimeChange(index, e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                  <div className="w-1/3 ml-4">
                    <label
                      htmlFor={`end-time-${index}`}
                      className="block mb-2 text-sm font-medium text-gray-700"
                    >
                      End Time
                    </label>
                    <input
                      type="time"
                      id={`end-time-${index}`}
                      value={schedule.endTime}
                      onChange={(e) =>
                        handleEndTimeChange(index, e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddMore}
              className="w-full mt-4 py-2 bg-white text-primary border border-primary font-semibold rounded-lg "
            >
              Add More
            </button>
            <button
              type="submit"
              className="w-full mt-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary transition duration-300"
            >
              Proceed to Uploading Documents
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};


const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-lg text-gray-500">Loading schedule...</p>
  </div>
);
const VetSchedulePage = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <VetScheduleForm />
    </Suspense>
  );
}


export default VetSchedulePage;
