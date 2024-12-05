"use client";

import { useEffect, useState } from "react";

interface Application {
  application_type: "foster" | "adoption";
  application_id: string;
  pet_id: string;
  status: string;
  created_at: string;
}

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        // Retrieve the user object from local storage
        const userString = localStorage.getItem("user");
        if (!userString) {
          setError("User data not found in local storage");
          setLoading(false);
          return;
        }

        // Parse the user object to extract the user ID
        const user = JSON.parse(userString);
        const user_id = user?.id;
        if (!user_id) {
          setError("User ID is missing from the user object");
          setLoading(false);
          return;
        }

        // Fetch applications from the API
        const response = await fetch(`/api/get-my-applications/${user_id}`);
        if (!response.ok) {
          const { error } = await response.json();
          setError(error || "Failed to fetch applications");
          setLoading(false);
          return;
        }

        const data = await response.json();
        setApplications(data.applications);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching applications:", err);
        setError("An unexpected error occurred");
        setLoading(false);
      }
    };

    fetchApplications();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg font-medium text-gray-700">Loading your applications...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500 text-lg font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Applications</h1>
      {applications.length === 0 ? (
        <p className="text-gray-600 text-center">No applications found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {applications.map((app) => (
            <div
              key={app.application_id}
              className="bg-white border border-gray-200 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200"
            >
              <h3 className="text-lg font-semibold text-gray-800">
                {app.application_type === "foster" ? "Foster Application" : "Adoption Application"}
              </h3>
              <p className="text-gray-600">
                <strong>Pet ID:</strong> {app.pet_id}
              </p>
              <p className="text-gray-600">
                <strong>Status:</strong>{" "}
                <span
                  className={`px-2 py-1 rounded ${
                    app.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : app.status === "approved"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {app.status}
                </span>
              </p>
              <p className="text-gray-600">
                <strong>Created At:</strong> {new Date(app.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
