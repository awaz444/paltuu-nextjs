"use client";
import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/navbar";
import { PlusOutlined, LoadingOutlined } from "@ant-design/icons"; // Added LoadingOutlined
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
  const postId = searchParams.get("post_id"); // Get post_id from the query params

  const [fileList, setFileList] = useState<UploadFile[]>([]); // State for uploaded files
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // New loading state

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true); // Start loading

    if (!postId) {
      message.error("Post ID is missing.");
      setIsSubmitting(false);
      return;
    }

    if (fileList.length === 0) {
      message.error("Please upload at least one image.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Create FormData and append file and post_id
      const formData = new FormData();
      if (fileList[0]?.originFileObj) {
        formData.append("file", fileList[0].originFileObj);
        formData.append("post_id", postId);
      }

      // Send directly to our API route
      const response = await axios.post("/api/upload-lost-found-image", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        message.success("Image uploaded successfully.");
        router.push("/listing-created-lost-and-found"); 
      } else {
        message.error("Failed to upload image.");
      }
    } catch (error) {
      message.error("Error occurred while uploading image.");
      console.error(error);
    } finally {
      setIsSubmitting(false); // End loading regardless of success/failure
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
      <div className="fullBody min-h-screen" style={{ maxWidth: "90%", margin: "0 auto" }}>
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
              listType="picture-card"
              fileList={fileList}
              onPreview={handlePreview}
              onChange={handleChange}
              maxCount={1}
              beforeUpload={beforeUpload}
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

          {/* Submit Button with Loading State */}
          <button
            type="submit"
            className="mt-4 p-3 bg-primary text-white rounded-3xl w-full flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingOutlined />
                Uploading...
              </>
            ) : (
              "Upload Image"
            )}
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