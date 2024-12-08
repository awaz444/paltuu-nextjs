"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import Navbar from "../../components/navbar";
import { PlusOutlined } from "@ant-design/icons";
import { Image, Upload, message } from "antd";
import type { UploadFile, UploadProps } from "antd";
import { useSetPrimaryColor } from "../hooks/useSetPrimaryColor";
import axios from "axios";
import { useSearchParams } from 'next/navigation';

// Image upload handling
const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/');
  if (!isImage) {
    message.error("You can only upload image files!");
  }
  const isSmallEnough = file.size / 1024 / 1024 < 5; // 5MB max size
  if (!isSmallEnough) {
    message.error("Image must be smaller than 5MB!");
  }
  return isImage && isSmallEnough;
};

const getBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

function CreatePetList() {
  useSetPrimaryColor();

  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");

  const [fileList, setFileList] = useState<UploadFile[]>([]); // State for uploaded files
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");

  const [category, setCategory] = useState<'lost' | 'found'>('lost'); // State to toggle between Lost and Found

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!petId) {
      message.error("Pet ID is missing.");
      return;
    }

    if (fileList.length === 0) {
      message.error("Please upload at least one image.");
      return;
    }

    try {
      // Prepare FormData for API call
      const formData = new FormData();
      fileList.forEach((file) => {
        if (file.originFileObj) {
          formData.append("files", file.originFileObj);
        }
      });
      formData.append("pet_id", String(petId)); // Use petId from URL query
      formData.append("category", category); // Add category (Lost or Found)

      // Send images to the backend API for uploading
      const response = await axios.post("/api/upload-image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.urls) {
        // Once images are uploaded, update the pet's images in the database
        const petData = {
          petId,
          images: response.data.urls, // Use the URLs returned from Cloudinary
        };

        console.log("Images Uploaded and Pet Updated...");
        router.push("/listing-created"); // Redirect after successful upload
      } else {
        message.error("Failed to upload images.");
      }
    } catch (error) {
      message.error("Error occurred while uploading images.");
      console.error(error);
    }
  };

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as File);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
  };

  const handleChange: UploadProps["onChange"] = ({ fileList: newFileList }) =>
    setFileList(newFileList);

  const uploadButton = (
    <button style={{ border: 0, background: "none" }} type="button">
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>Upload</div>
    </button>
  );

  return (
    <>
      <Navbar />
      <div className="fullBody" style={{ maxWidth: "90%", margin: "0 auto" }}>
        <form
          className="bg-white p-6 rounded-3xl shadow-md w-full max-w-lg mx-auto my-8"
          onSubmit={handleSubmit}
        >
          

          {/* Upload Images */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Upload Image
            </label>
            <Upload
              action=""
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              maxCount={1}
            >
              {fileList.length >= 1 ? null : uploadButton}
            </Upload>
            {previewImage && (
              <Image
                wrapperStyle={{ display: "none" }}
                preview={{
                  visible: previewOpen,
                  onVisibleChange: (visible) => setPreviewOpen(visible),
                  afterOpenChange: (visible) => !visible && setPreviewImage(""),
                }}
                src={previewImage}
              />
            )}
          </div>

          {/* Additional Fields */}
          {category === 'found' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Date Found
              </label>
              <input
                type="date"
                className="mt-1 p-3 w-full border rounded-2xl"
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="mt-4 p-3 bg-primary text-white rounded-3xl w-full"
          >
            Upload Images
          </button>
        </form>
      </div>
    </>
  );
}

const LoadingFallback = () => (
  <div className="flex justify-center items-center min-h-screen">
    <p className="text-lg text-gray-500">Loading create pet listing...</p>
  </div>
);

const CreatePetListing: React.FC = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreatePetList />
    </Suspense>
  );
};

export default CreatePetListing;
