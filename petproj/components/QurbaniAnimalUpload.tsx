// AnimalPhotosUpload.tsx
import React, { useState } from 'react';
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

interface AnimalPhotosUploadProps {
    animalId: string;
    onComplete: () => void;
    onBack: () => void;
}

const AnimalPhotosUpload: React.FC<AnimalPhotosUploadProps> = ({ 
    animalId, 
    onComplete,
    onBack 
}) => {
    const [fileList, setFileList] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);

     const handleUpload = async () => {
        try {
            setUploading(true);
            const formData = new FormData();
            formData.append('animal_id', animalId); // No .toString() needed
            
            fileList.forEach(file => {
                formData.append('files', file.originFileObj);
            });

            // Updated endpoint to match your API
            const response = await fetch('/api/qurbani-animals/images', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to upload photos');
            }

            message.success('Photos uploaded successfully!');
            onComplete();
        } catch (error) {
            
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Upload
                listType="picture-card"
                fileList={fileList}
                onChange={({ fileList }) => setFileList(fileList)}
                beforeUpload={() => false}
                accept="image/*"
                multiple
            >
                {fileList.length >= 8 ? null : (
                    <div className="flex flex-col items-center">
                        <UploadOutlined className="text-primary" />
                        <div className="mt-1 text-sm">Upload</div>
                    </div>
                )}
            </Upload>

            <div className="flex justify-between pt-4 border-t border-gray-100">
                <Button onClick={onBack} className="px-6">
                    Back
                </Button>
                <Button
                    type="primary"
                    onClick={handleUpload}
                    loading={uploading}
                    className="px-6"
                    disabled={fileList.length === 0}
                >
                    {uploading ? 'Uploading...' : 'Complete Listing'}
                </Button>
            </div>
        </div>
    );
};

export default AnimalPhotosUpload;