"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import { Upload, message, Image } from "antd";
import { PlusOutlined } from "@ant-design/icons";

const VerificationInfo = () => {
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileLists, setFileLists] = useState<Record<number, any[]>>({});
  const [submittedQualifications, setSubmittedQualifications] = useState<
    Record<number, boolean>
  >({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const router = useRouter();

  useSetPrimaryColor();

  const fetchQualifications = async (userId: string) => {
    try {
      const response = await fetch(`/api/vet-get-qualifications/${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch qualifications");
      }
      const data = await response.json();
      console.log("Fetched Qualifications:", data); // Log the qualifications
      setQualifications(data.qualifications);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userString = localStorage.getItem("user");
    if (!userString) {
      router.push("/login");
      return;
    }

    const user = JSON.parse(userString);
    const userId = user?.id;
    console.log("User ID from localStorage:", userId); // Log user ID from localStorage
    if (!userId) {
      setError("Invalid user data");
      setLoading(false);
      return;
    }

    fetchQualifications(userId);
  }, [router]);

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith("image/");
    const isSmallEnough = file.size / 1024 / 1024 < 5;
    console.log("Before Upload Check:", { isImage, isSmallEnough }); // Log upload checks
    if (!isImage) {
      message.error("You can only upload image files!");
      return false;
    }
    if (!isSmallEnough) {
      message.error("Image must be smaller than 5MB!");
      return false;
    }
    return true;
  };

  const handlePreview = async (file: any) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }
    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange =
    (qualificationId: number) =>
      ({ fileList }: any) => {
        setFileLists((prev) => ({ ...prev, [qualificationId]: fileList }));
        console.log("File list updated for qualification:", qualificationId, fileList); // Log updated file list
      };

  const getBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });

  const handleSubmit = async (qualificationId: number, fileList: any[]) => {
    if (fileList.length === 0) {
      message.error("Please upload at least one certificate image.");
      return;
    }

    const userString = localStorage.getItem("user");
    if (!userString) {
      message.error("User not found, please log in again.");
      router.push("/login");
      return;
    }

    const user = JSON.parse(userString);
    const vetId = user?.id;
    console.log("User id:", vetId, "qualification_id:", qualificationId, "fileList:", fileList); // Log submission data

    const formData = new FormData();
    fileList.forEach((file) => {
      if (file.originFileObj) {
        formData.append("files", file.originFileObj);
      }
    });
    formData.append("vet_id", vetId);
    formData.append("qualification_id", qualificationId.toString());

    try {
      const response = await fetch("/api/upload-verification-images", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        message.success("Certificate uploaded successfully!");
        console.log("Uploaded URLs:", data.urls); // Log uploaded URLs
        setSubmittedQualifications((prev) => ({
          ...prev,
          [qualificationId]: true,
        }));
      } else {
        const error = await response.json();
        message.error(error.message || "Failed to upload certificates.");
        console.error("Upload failed:", error); // Log upload failure
      }
    } catch (error) {
      message.error("An error occurred while uploading certificates.");
      console.error("Error during upload:", error); // Log error during upload
    }
  };

  const allSubmitted = qualifications.every(
    (qualification) => submittedQualifications[qualification.qualification_id]
  );

  return (
    <>
      <div className="min-h-screen flex">
        {/* Left Side with Logo and Background */}
        <div className="sm:w-1/2 flex flex-col justify-center items-center bg-primary p-8 text-white rounded-r-3xl">
          <img src="/paltu_logo.svg" alt="Paltu Logo" className="mb-6" />
        </div>

        {/* Right Side with the Form */}
        <div className="w-1/2 bg-gray-100 flex items-center justify-center px-8 py-12">
          <div className="w-full max-w-2xl mx-auto p-6 bg-white shadow-md rounded-lg mt-10">

              <h1 className="text-3xl font-semibold text-gray-800 mb-6">
                Verification Information
              </h1>

              {loading ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-lg text-gray-700">Loading qualifications...</p>
                </div>
              ) : error ? (
                <div className="flex justify-center items-center h-full">
                  <p className="text-lg text-red-600">Error: {error}</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg text-gray-700 mb-4">
                    Please verify your qualifications by uploading relevant
                    certificates.
                  </p>
                  <div className="qualifications-list mb-6">
                    {qualifications.length === 0 ? (
                      <p className="text-lg text-gray-600">
                        No qualifications found.
                      </p>
                    ) : (
                      <ul className="space-y-4">
                        {qualifications.map((qualification) => (
                          <li
                            key={qualification.qualification_id}
                            className="p-4 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                          >
                            <strong className="text-xl text-primary">
                              {qualification.qualification_name}
                            </strong>
                            <p className="text-gray-600">
                              Acquired in: {qualification.year_acquired}
                            </p>
                            <em className="text-gray-500">
                              Note: {qualification.note}
                            </em>
                            <div className="file-upload-container mt-4">
                              <Upload
                                listType="picture-card"
                                fileList={
                                  fileLists[qualification.qualification_id] || []
                                }
                                onPreview={handlePreview}
                                onChange={handleChange(
                                  qualification.qualification_id
                                )}
                                beforeUpload={beforeUpload}
                                maxCount={1}
                              >
                                {fileLists[qualification.qualification_id]?.length ===
                                  1
                                  ? null
                                  : (
                                    <button
                                      style={{
                                        border: 0,
                                        background: "none",
                                      }}
                                      type="button"
                                    >
                                      <PlusOutlined />
                                      <div style={{ marginTop: 8 }}>Upload</div>
                                    </button>
                                  )}
                              </Upload>
                            </div>
                            {previewImage && (
                              <Image
                                wrapperStyle={{ display: "none" }}
                                preview={{
                                  visible: previewOpen,
                                  onVisibleChange: (visible) =>
                                    setPreviewOpen(visible),
                                }}
                                src={previewImage}
                              />
                            )}
                            {!submittedQualifications[qualification.qualification_id] && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleSubmit(
                                    qualification.qualification_id,
                                    fileLists[qualification.qualification_id] || []
                                  )
                                }
                                className="mt-4 p-3 bg-primary text-white rounded-xl"
                              >
                                Submit Certificate
                              </button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {allSubmitted && (
                    <button
                      type="button"
                      onClick={() => router.push("/vet-process-complete")}      
                      className="mt-6 p-4 bg-primary text-white rounded-3xl w-full"
                    >
                      Proceed
                    </button>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
};

export default VerificationInfo;

