"use client";
import React, { useState } from "react";
import { FaTrash, FaPlus, FaClock, FaCalendarAlt } from "react-icons/fa";

interface StepFourProps {
  formData: any;
  setFormData: (data: any) => void;
  back: () => void;
  onComplete: () => Promise<void>;
  isSubmitting: boolean;
}

interface Schedule {
  day: string;
  startTime: string;
  endTime: string;
}

const StepFour_Schedule: React.FC<StepFourProps> = ({ formData, setFormData, back, onComplete, isSubmitting }) => {
  const [schedules, setSchedules] = useState<Schedule[]>(
    formData.schedules || [{ day: "", startTime: "", endTime: "" }]
  );
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const daysOfWeek = [
    "Monday",
    "Tuesday", 
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ];

  const handleDayChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].day = value;
    setSchedules(newSchedules);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleStartTimeChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].startTime = value;
    setSchedules(newSchedules);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleEndTimeChange = (index: number, value: string) => {
    const newSchedules = [...schedules];
    newSchedules[index].endTime = value;
    setSchedules(newSchedules);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleAddMore = () => {
    const newSchedules = [...schedules, { day: "", startTime: "", endTime: "" }];
    setSchedules(newSchedules);
    setFormData({ ...formData, schedules: newSchedules });
  };

  const handleRemoveSchedule = (index: number) => {
    if (schedules.length > 1) {
      const newSchedules = schedules.filter((_, i) => i !== index);
      setSchedules(newSchedules);
      setFormData({ ...formData, schedules: newSchedules });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!schedules.some(schedule => schedule.day && schedule.startTime && schedule.endTime)) {
      newErrors.schedules = "Please add at least one complete schedule";
    }

    // Check for duplicate days
    const days = schedules.filter(s => s.day).map(s => s.day);
    const duplicateDays = days.filter((day, index) => days.indexOf(day) !== index);
    if (duplicateDays.length > 0) {
      newErrors.duplicates = `Duplicate days found: ${duplicateDays.join(", ")}`;
    }

    // Validate time ranges
    schedules.forEach((schedule, index) => {
      if (schedule.day && schedule.startTime && schedule.endTime) {
        if (schedule.startTime >= schedule.endTime) {
          newErrors[`time_${index}`] = "End time must be after start time";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    await onComplete();
  };

  return (
    <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-semibold">Set Your Schedule</h2>
        <p className="text-gray-600 text-center mb-6">
          Define your availability for consultations
        </p>
      </div>

      {errors.schedules && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-xs">{errors.schedules}</p>
        </div>
      )}

      {errors.duplicates && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-xs">{errors.duplicates}</p>
        </div>
      )}

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {schedules.map((schedule, index) => (
          <div
            key={index}
            className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-800 flex items-center">
                <FaClock className="mr-2 text-primary" />
                Schedule {index + 1}
              </h3>
              {schedules.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveSchedule(index)}
                  className="text-red-500 hover:text-red-700 transition-colors p-2"
                  title="Remove schedule"
                >
                  <FaTrash />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {/* Day Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Day of Week
                </label>
                <select
                  value={schedule.day}
                  onChange={(e) => handleDayChange(index, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                >
                  <option value="">Select day</option>
                  {daysOfWeek.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Start Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleStartTimeChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>

                {/* End Time */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleEndTimeChange(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {errors[`time_${index}`] && (
              <p className="text-red-500 text-xs">{errors[`time_${index}`]}</p>
            )}

            {schedule.day && schedule.startTime && schedule.endTime && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="text-green-700 text-xs">
                  ✓ {schedule.day}: {schedule.startTime} - {schedule.endTime}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add More Button */}
      <button
        type="button"
        onClick={handleAddMore}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
      >
        <FaPlus />
        <span>Add Another Schedule</span>
      </button>

      {/* Summary */}
      {schedules.some(s => s.day && s.startTime && s.endTime) && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h4 className="font-medium text-blue-800 mb-2 text-sm">Schedule Summary:</h4>
          <div className="space-y-1">
            {schedules
              .filter(s => s.day && s.startTime && s.endTime)
              .map((schedule, index) => (
                <p key={index} className="text-blue-700 text-xs">
                  {schedule.day}: {schedule.startTime} - {schedule.endTime}
                </p>
              ))}
          </div>
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
          onClick={handleSubmit}
          disabled={isSubmitting || !schedules.some(s => s.day && s.startTime && s.endTime)}
          className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Completing Registration...</span>
            </span>
          ) : (
            "Complete Registration"
          )}
        </button>
      </div>
    </div>
  );
};

export default StepFour_Schedule;