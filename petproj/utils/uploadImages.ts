export const uploadImagesToCloudinary = async (files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
  
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error('Failed to upload images');
    }
  
    const data: { urls: string[] } = await response.json();
    return data.urls; // Return the array of uploaded image URLs
  };
  