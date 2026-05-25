/**
 * Upload images to AWS S3 via the server-side upload-image route.
 * Returns an array of S3/CloudFront URLs for the uploaded images.
 */
export const uploadImages = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const response = await fetch('/api/v1/upload-image', {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error('Failed to upload images');
    }

    const data: { urls: string[] } = await response.json();
    return data.urls;
};

/** @deprecated Use `uploadImages` instead */
export const uploadImagesToCloudinary = uploadImages;