"use client";
import React from "react";
import { Upload } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface StepOneProps {
    data: {
        shelterName: string;
        address: string;
        description: string;
        logo: File | null;
        photos: File[];
    };
    setData: (updatedData: Partial<StepOneProps['data']>) => void;
    next: () => void;
}

const StepOne: React.FC<StepOneProps> = ({ data, setData, next }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setData({ [name]: value });
    };

    const handleFileChange = (field: 'logo' | 'photos', file: File | File[] | null) => {
        if (field === 'logo') {
            setData({ logo: file as File });
        } else if (field === 'photos') {
            setData({ photos: file as File[] });
        }
    };

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-4">
            <h2 className="text-2xl font-semibold text-center">Shelter Profile</h2>
            <p className="text-gray-600 text-center mb-6">
                Tell us about your shelter and upload some images
            </p>

            {/* Shelter Name */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Shelter Name
                </label>
                <input
                    type="text"
                    name="shelterName"
                    value={data.shelterName}
                    onChange={handleChange}
                    placeholder="Paws of Hope Rescue"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                />
            </div>

            {/* Address */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Address
                </label>
                <input
                    type="text"
                    name="address"
                    value={data.address}
                    onChange={handleChange}
                    placeholder="123 Rescue Road, City"
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                />
            </div>

        
            {/* Description */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Short Description
                </label>
                <textarea
                    name="description"
                    value={data.description}
                    onChange={handleChange}
                    placeholder="Our mission is to rescue and rehabilitate abandoned animals..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                />
            </div>

            {/* Logo Upload */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Shelter Logo
                </label>
                <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleFileChange('logo', file);
                        return false;
                    }}
                >
                    {data.logo ? (
                        <img 
                            src={URL.createObjectURL(data.logo)} 
                            alt="Shelter logo" 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload Logo</div>
                        </div>
                    )}
                </Upload>
            </div>

            {/* Photos Upload */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Shelter Photos (3 images)
                </label>
                <Upload
                    listType="picture-card"
                    multiple
                    beforeUpload={(file) => {
                        const newPhotos = [...(data.photos || []), file];
                        handleFileChange('photos', newPhotos.slice(0, 3)); // Limit to 3 photos
                        return false;
                    }}
                    onRemove={(file) => {
                        const newPhotos = data.photos.filter(
                            (photo) => photo.name !== (file as any).name
                        );
                        handleFileChange('photos', newPhotos);
                    }}
                    fileList={data.photos?.map((photo, index) => ({
                        uid: `${index}`,
                        name: photo.name,
                        status: 'done',
                        url: URL.createObjectURL(photo),
                    }))}
                >
                    {data.photos?.length >= 3 ? null : (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Add Photos</div>
                        </div>
                    )}
                </Upload>
                <p className="text-xs text-gray-500 mt-1">
                    Upload images of your kennels, yard, and animals
                </p>
            </div>

            {/* Navigation */}
            <div className="flex justify-center mt-6">
                <button
                    type="button"
                    onClick={next}
                    disabled={!data.shelterName || !data.address || !data.description || !data.logo || data.photos.length < 3}
                    className={`bg-primary text-white font-semibold py-2 px-6 rounded-xl ${
                        !data.shelterName || !data.address || !data.description || !data.logo || data.photos.length < 3
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                    }`}
                >
                    Continue
                </button>
            </div>
        </div>
    );
};

export default StepOne;