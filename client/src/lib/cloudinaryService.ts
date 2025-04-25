import { v2 as cloudinary } from 'cloudinary';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: string;
}

export const cloudinaryService = {
  async uploadImage(file: File): Promise<string> {
    try {
      if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Cloudinary configuration is missing');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload image to Cloudinary');
      }

      const data = await response.json() as CloudinaryResponse;
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to upload image');
    }
  }
};