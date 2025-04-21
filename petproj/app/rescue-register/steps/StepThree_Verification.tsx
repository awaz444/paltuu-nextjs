"use client";
import React from "react";
import { Upload, UploadFile } from "antd";
import { PlusOutlined } from "@ant-design/icons";

interface StepThreeProps {
    data: {
        regCert: File | null;
        cnicFront: File | null;
        cnicBack: File | null;
    };
    setData: (updatedData: Partial<StepThreeProps['data']>) => void;
    next: () => void;
    back: () => void;
}

const RescueStepThree: React.FC<StepThreeProps> = ({
    data,
    setData,
    next,
    back
}) => {
    const handleFileChange = (field: keyof StepThreeProps['data'], file: File | null) => {
        setData({ [field]: file });
    };

    return (
        <div className="w-full max-w-md bg-white shadow-lg rounded-3xl p-6 space-y-5">
            <h2 className="text-2xl font-semibold text-center">Verification</h2>
            <p className="text-gray-600 text-center mb-4">
                Upload required documents for verification
            </p>

            {/* Registration Certificate Upload */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Shelter Registration Certificate (PDF/image)
                </label>
                <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleFileChange('regCert', file);
                        return false;
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                >
                    {data.regCert ? (
                        <div className="flex flex-col items-center">
                            <div className="text-lg">✅</div>
                            <div className="text-xs mt-1">
                                {data.regCert.name.length > 15 
                                    ? `${data.regCert.name.substring(0, 15)}...` 
                                    : data.regCert.name}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </Upload>
                <p className="text-xs text-gray-500 mt-1">
                    Upload your official shelter registration document
                </p>
            </div>

            {/* CNIC Front Upload */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Admin CNIC Front
                </label>
                <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleFileChange('cnicFront', file);
                        return false;
                    }}
                    accept=".jpg,.jpeg,.png"
                >
                    {data.cnicFront ? (
                        <img 
                            src={URL.createObjectURL(data.cnicFront)} 
                            alt="CNIC Front" 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </Upload>
            </div>

            {/* CNIC Back Upload */}
            <div>
                <label className="block text-gray-700 text-sm font-medium mb-1">
                    Admin CNIC Back
                </label>
                <Upload
                    listType="picture-card"
                    showUploadList={false}
                    beforeUpload={(file) => {
                        handleFileChange('cnicBack', file);
                        return false;
                    }}
                    accept=".jpg,.jpeg,.png"
                >
                    {data.cnicBack ? (
                        <img 
                            src={URL.createObjectURL(data.cnicBack)} 
                            alt="CNIC Back" 
                            className="w-full h-full object-contain"
                        />
                    ) : (
                        <div>
                            <PlusOutlined />
                            <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                    )}
                </Upload>
            </div>

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
                <button
                    type="button"
                    onClick={back}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-xl"
                >
                    Back
                </button>
                <button
                    type="button"
                    onClick={next}
                    disabled={!data.regCert || !data.cnicFront || !data.cnicBack}
                    className={`bg-primary text-white font-semibold py-2 px-4 rounded-xl ${
                        !data.regCert || !data.cnicFront || !data.cnicBack
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary-dark"
                    }`}
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default RescueStepThree;